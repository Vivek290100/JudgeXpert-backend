// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\services\ProblemService.ts
import { IProblem } from "../interfaces/IProblem";
import { IProblemService } from "../interfaces/IProblemService";
import { ProblemDefinitionParser, FullProblemDefinitionParser } from "../utils/problemParsers";
import fs from "fs/promises";
import path from "path";
import { FilterQuery, UpdateQuery } from "mongoose";
import TestCase from "../models/TestCaseModel";
import DefaultCode from "../models/DefaultCodeModel";
import { Types } from "mongoose";
import { SUPPORTED_LANGUAGES, getLanguageId, validateLanguage } from "../config/Languages";
import { IProblemRepository } from "../interfaces/IProblemRepository";

class ProblemService implements IProblemService {
  constructor(private problemRepository: IProblemRepository) {}

  async createProblemFromFiles(problemDir: string): Promise<IProblem | null> {
    const basePath = process.env.PROBLEM_BASE_PATH || path.join(__dirname, "../problems");
    const fullProblemDir = path.join(basePath, problemDir);
  
    const structurePath = path.join(fullProblemDir, "Structure.md");
    const problemPath = path.join(fullProblemDir, "Problem.md");
    const inputsDir = path.join(fullProblemDir, "inputs");
    const outputsDir = path.join(fullProblemDir, "outputs");
    const boilerplateDir = path.join(fullProblemDir, "boilerplate");
    const boilerplateFullDir = path.join(fullProblemDir, "boilerplate-full");
  
    // Validate directory structure
    await Promise.all([
      fs.access(structurePath),
      fs.access(problemPath),
      fs.access(inputsDir),
      fs.access(outputsDir),
    ]).catch(() => {
      throw new Error(`Invalid problem directory structure: ${problemDir}`);
    });
  
    const [description, structure] = await Promise.all([
      fs.readFile(problemPath, "utf-8"),
      fs.readFile(structurePath, "utf-8"),
    ]);
  
    const parser = new ProblemDefinitionParser();
    parser.parse(structure);
  
    const languages = SUPPORTED_LANGUAGES.map((lang) => lang.name);
    let defaultCode: { language: string; code: string }[] = [];
    let fullDefaultCode: { language: string; code: string }[] = [];
  
    const boilerplateFiles = {
      partial: languages.map((lang) => path.join(boilerplateDir, `function.${lang}`)),
      full: languages.map((lang) => path.join(boilerplateFullDir, `function.${lang}`)),
    };
  
    await Promise.all([
      fs.mkdir(boilerplateDir, { recursive: true }),
      fs.mkdir(boilerplateFullDir, { recursive: true }),
    ]);
  
    for (const [index, lang] of languages.entries()) {
      if (!validateLanguage(lang)) {
        console.warn(`Unsupported language: ${lang}, skipping...`);
        continue;
      }
  
      const filePath = boilerplateFiles.partial[index];
      try {
        const code = await fs.readFile(filePath, "utf-8");
        defaultCode.push({ language: lang, code });
      } catch (error) {
        console.log(`Partial boilerplate for ${lang} not found, generating...`);
        const code = parser.generateCode(lang);
        await fs.writeFile(filePath, code);
        defaultCode.push({ language: lang, code });
      }
    }
  
    const fullParser = new FullProblemDefinitionParser();
    fullParser.parse(structure);
    for (const [index, lang] of languages.entries()) {
      if (!validateLanguage(lang)) {
        console.warn(`Unsupported language: ${lang}, skipping...`);
        continue;
      }
  
      const filePath = boilerplateFiles.full[index];
      try {
        const code = await fs.readFile(filePath, "utf-8");
        fullDefaultCode.push({ language: lang, code });
      } catch (error) {
        console.log(`Full boilerplate for ${lang} not found, generating...`);
        const code = fullParser.generateCode(lang);
        await fs.writeFile(filePath, code);
        console.log(`Full boilerplate for ${lang} generated`);
        fullDefaultCode.push({ language: lang, code });
      }
    }
  
    const testCases: { input: string; output: string; index: number }[] = [];
    const [inputFiles, outputFiles] = await Promise.all([
      fs.readdir(inputsDir).then((files) => files.sort()),
      fs.readdir(outputsDir).then((files) => files.sort()),
    ]);
  
    if (inputFiles.length !== outputFiles.length) {
      throw new Error("Mismatch between input and output test case files");
    }
  
    for (let i = 0; i < inputFiles.length; i++) {
      const [input, output] = await Promise.all([
        fs.readFile(path.join(inputsDir, inputFiles[i]), "utf-8").then((s) => s.trim()),
        fs.readFile(path.join(outputsDir, outputFiles[i]), "utf-8").then((s) => s.trim()),
      ]);
      testCases.push({ input, output, index: i });
    }
  
    const problemData: Partial<IProblem> = {
      title: parser.problemName || path.basename(problemDir),
      description,
      difficulty: "MEDIUM",
      slug: path.basename(problemDir).toLowerCase().replace(/\s+/g, "-"),
      status: "free",
      memory: 256,
      time: 1000,
      judge0TrackingId: null,
      updatedAt: new Date(),
    };
  
    const query: FilterQuery<IProblem> = { slug: problemData.slug! };
    const update: UpdateQuery<IProblem> = { $set: problemData };
    const options = { upsert: true, new: true };
  
    const problem = await this.problemRepository.upsertProblem(query, update, options);
    if (!problem?._id) {
      throw new Error("Failed to create or update problem: no document returned");
    }
  
    const testCaseIds: Types.ObjectId[] = [];
    for (const testCase of testCases) {
      const newTestCase = new TestCase({
        problemId: problem._id,
        input: testCase.input,
        output: testCase.output,
        index: testCase.index,
        status: "active",
      });
      const savedTestCase = await newTestCase.save();
      testCaseIds.push(savedTestCase._id);
    }
  
    const defaultCodeIds: Types.ObjectId[] = [];
    for (const code of defaultCode) {
      const languageId = getLanguageId(code.language);
      if (!languageId) {
        throw new Error(`Unsupported language: ${code.language}`);
      }
      const languageName = SUPPORTED_LANGUAGES.find((lang) => lang.id === languageId)?.name || "Unknown";
  
      const newDefaultCode = new DefaultCode({
        languageId,
        languageName,
        problemId: problem._id,
        code: code.code.replace("##USER_CODE_HERE##", ""),
        status: "active",
      });
      const savedDefaultCode = await newDefaultCode.save();
      defaultCodeIds.push(savedDefaultCode._id);
    }
  
    await this.problemRepository.upsertProblem(
      { _id: problem._id },
      { $set: { testCaseIds, defaultCodeIds } },
      { new: true }
    );
  
    return problem;
  }

  async getProblemById(id: string): Promise<IProblem | null> {
    return this.problemRepository.findById(id);
  }

  async getProblemBySlug(slug: string): Promise<IProblem | null> {
    return this.problemRepository.findBySlug(slug);
  }

  async getProblemsPaginated(
    page: number,
    limit: number,
    query: FilterQuery<IProblem> = {}
  ): Promise<{ problems: IProblem[]; total: number }> {
    try {
      return await this.problemRepository.findPaginated(page, limit, query);
    } catch (error) {
      throw new Error(`Failed to fetch problems: ${(error as Error).message}`);
    }
  }

  async processSpecificProblem(problemDir: string): Promise<IProblem | null> {
    return await this.createProblemFromFiles(problemDir);
  }

  async updateProblemStatus(id: string, status: "premium" | "free"): Promise<IProblem | null> {
    const validStatuses: Array<"premium" | "free"> = ["premium", "free"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status value: ${status}. Must be "premium" or "free".`);
    }
    return this.problemRepository.update(id, { status });
  }

  async updateProblem(id: string, updates: Partial<IProblem>): Promise<IProblem | null> {
    return this.problemRepository.update(id, updates);
  }
}

export default ProblemService;
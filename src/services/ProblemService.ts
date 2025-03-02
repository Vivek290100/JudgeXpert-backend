// src/services/ProblemService.ts
import { IProblem } from "../interfaces/IProblem";
import { IProblemService } from "../interfaces/IProblemService";
import ProblemRepository from "../repositories/ProblemRepository";
import { ProblemDefinitionParser, FullProblemDefinitionParser } from "../utils/problemParsers";
import fs from "fs";
import path from "path";
import { FilterQuery, UpdateQuery } from "mongoose";
import TestCase from "../models/TestCaseModel";
import DefaultCode from "../models/DefaultCodeModel";
import { Types } from "mongoose";
import { SUPPORTED_LANGUAGES, getLanguageId, validateLanguage } from "../config/Languages";

class ProblemService implements IProblemService {
  constructor(public problemRepository: ProblemRepository) {}

  async createProblemFromFiles(problemDir: string): Promise<IProblem | null> {
    console.log(" inside Create problem data createProblemFromFiles ", problemDir);
    const basePath = process.env.PROBLEM_BASE_PATH || path.join(__dirname, "../problems");
    const fullProblemDir = path.join(basePath, problemDir);

    const structurePath = path.join(fullProblemDir, "Structure.md");
    const problemPath = path.join(fullProblemDir, "Problem.md");
    const inputsDir = path.join(fullProblemDir, "inputs");
    const outputsDir = path.join(fullProblemDir, "outputs");
    const boilerplateDir = path.join(fullProblemDir, "boilerplate");
    const boilerplateFullDir = path.join(fullProblemDir, "boilerplate-full");

    // Read problem description
    const description = fs.readFileSync(problemPath, "utf-8");

    // Parse structure for boilerplate and function details
    const structure = fs.readFileSync(structurePath, "utf-8");
    const parser = new ProblemDefinitionParser();
    parser.parse(structure);

    // Use dynamic languages from config
    const languages = SUPPORTED_LANGUAGES.map(lang => lang.name);
    let defaultCode: { language: string; code: string }[] = [];
    let fullDefaultCode: { language: string; code: string }[] = [];

    const boilerplateFiles = {
      partial: languages.map(lang => path.join(boilerplateDir, `function.${lang}`)),
      full: languages.map(lang => path.join(boilerplateFullDir, `function.${lang}`))
    };

    // Ensure boilerplate directories exist
    if (!fs.existsSync(boilerplateDir)) fs.mkdirSync(boilerplateDir, { recursive: true });
    if (!fs.existsSync(boilerplateFullDir)) fs.mkdirSync(boilerplateFullDir, { recursive: true });

    // Check and generate partial boilerplate for each supported language
    for (const [index, lang] of languages.entries()) {
      if (!validateLanguage(lang)) {
        console.warn(`Unsupported language: ${lang}, skipping...`);
        continue;
      }

      const filePath = boilerplateFiles.partial[index];
      try {
        defaultCode.push({ language: lang, code: fs.readFileSync(filePath, "utf-8") });
      } catch (error) {
        console.log(`Partial boilerplate for ${lang} not found, generating...`);
        const code = parser.generateCode(lang); // Use generateCode instead of individual methods
        fs.writeFileSync(filePath, code);
        defaultCode.push({ language: lang, code });
      }
    }

    // Check and generate full boilerplate for each supported language
    const fullParser = new FullProblemDefinitionParser();
    fullParser.parse(structure);
    for (const [index, lang] of languages.entries()) {
      if (!validateLanguage(lang)) {
        console.warn(`Unsupported language: ${lang}, skipping...`);
        continue;
      }

      const filePath = boilerplateFiles.full[index];
      try {
        fullDefaultCode.push({ language: lang, code: fs.readFileSync(filePath, "utf-8") });
      } catch (error) {
        console.log(`Full boilerplate for ${lang} not found, generating...`);
        const code = fullParser.generateCode(lang); // Use generateCode instead of individual methods
        fs.writeFileSync(filePath, code);
        fullDefaultCode.push({ language: lang, code });
      }
    }

    // Read test cases
    const testCases: { input: string; output: string; index: number }[] = [];
    const inputFiles = fs.readdirSync(inputsDir).sort();
    const outputFiles = fs.readdirSync(outputsDir).sort();
    for (let i = 0; i < inputFiles.length; i++) {
      const input = fs.readFileSync(path.join(inputsDir, inputFiles[i]), "utf-8").trim();
      const output = fs.readFileSync(path.join(outputsDir, outputFiles[i]), "utf-8").trim();
      testCases.push({ input, output, index: i });
    }

    // Create problem data without testCaseIds and defaultCodeIds initially
    const problemData: Partial<IProblem> = {
      title: parser.problemName || path.basename(problemDir),
      description,
      difficulty: "MEDIUM", // Default; could parse from Problem.md if specified
      slug: path.basename(problemDir).toLowerCase().replace(/\s+/g, "-"),
      status: "free",
      memory: 256, // Default memory limit (e.g., 256 KB)
      time: 1000, // Default time limit (e.g., 1 second)
      judge0TrackingId: null,
      updatedAt: new Date(),
    };

    // Use upsert via ProblemRepository first to get the problem _id
    const query: FilterQuery<IProblem> = { slug: problemData.slug! };
    const update: UpdateQuery<IProblem> = { $set: problemData };
    const options = { upsert: true, new: true }; // upsert: true creates if not found, new: true returns the created/updated document

    const problem = await this.problemRepository.upsertProblem(query, update, options);
    if (!problem?._id) {
      throw new Error("Failed to create or update problem: no document returned");
    }

    // Create TestCase documents with the problemId
    const testCaseIds: Types.ObjectId[] = [];
    for (const testCase of testCases) {
      const newTestCase = new TestCase({
        problemId: problem._id, // Set problemId immediately
        input: testCase.input,
        output: testCase.output,
        index: testCase.index,
        status: "active",
      });
      const savedTestCase = await newTestCase.save();
      testCaseIds.push(savedTestCase._id);
    }

    // Create DefaultCode documents with the problemId
    const defaultCodeIds: Types.ObjectId[] = [];
    for (const code of defaultCode) {
      const languageId = getLanguageId(code.language);
      if (!languageId) {
        throw new Error(`Unsupported language: ${code.language}`);
      }

      const newDefaultCode = new DefaultCode({
        languageId,
        problemId: problem._id, // Set problemId immediately
        code: code.code.replace("##USER_CODE_HERE##", ""),
        status: "active",
      });
      const savedDefaultCode = await newDefaultCode.save();
      defaultCodeIds.push(savedDefaultCode._id);
    }

    // Update the problem with testCaseIds and defaultCodeIds
    await this.problemRepository.upsertProblem(
      { _id: problem._id }, // Use the problem's _id for the query
      { $set: { testCaseIds, defaultCodeIds } }, // Update with the new IDs
      { new: true }
    );

    console.log("createProblemFromFiles problem ", problem);
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
    console.log("processSpecificProblem service problemDir", problemDir);
    return await this.createProblemFromFiles(problemDir);
  }

  async updateProblemStatus(id: string, status: "premium" | "free"): Promise<IProblem | null> {
    const validStatuses: Array<"premium" | "free"> = ["premium", "free"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status value: ${status}. Must be "premium" or "free".`);
    }
    
    return this.problemRepository.update(id, { status });
  }


}

export default ProblemService;
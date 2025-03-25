import { IProblem } from "../types/IProblem";
import { IProblemService } from "../interfaces/serviceInterfaces/IProblemService";
import { IProblemRepository } from "../interfaces/repositoryInterfaces/IProblemRepository";
import { ProblemDefinitionParser, FullProblemDefinitionParser } from "../utils/problemParsers";
import fs from "fs/promises";
import path from "path";
import TestCase from "../models/TestCaseModel";
import DefaultCode from "../models/DefaultCodeModel";
import { Types } from "mongoose";
import { FilterQuery, UpdateQuery } from "mongoose";
import { SUPPORTED_LANGUAGES, getLanguageConfig, getLanguageId, validateLanguage } from "../utils/languages";
import axios from "axios";
import { ExecutionResult } from "../types/IExecution";
import { TestCaseResult } from "../types/ITestCaseResult";
import { BadRequestError, ErrorMessages, NotFoundError } from "../utils/errors";
import Submission from "../models/SubmissionModel";
import User from "../models/UserModel";

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

    await Promise.all([
      fs.access(structurePath),
      fs.access(problemPath),
      fs.access(inputsDir),
      fs.access(outputsDir),
    ]).catch(() => {
      throw new BadRequestError(ErrorMessages.INVALID_PROBLEM_DIR_STRUCTURE(problemDir));
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
        console.warn(ErrorMessages.UNSUPPORTED_LANGUAGE(lang));
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
        console.warn(ErrorMessages.UNSUPPORTED_LANGUAGE(lang));
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
        fullDefaultCode.push({ language: lang, code });
      }
    }

    const testCases: { input: string; output: string; index: number }[] = [];
    const [inputFiles, outputFiles] = await Promise.all([
      fs.readdir(inputsDir).then((files) => files.sort()),
      fs.readdir(outputsDir).then((files) => files.sort()),
    ]);

    if (inputFiles.length !== outputFiles.length) {
      throw new BadRequestError(ErrorMessages.TEST_CASE_MISMATCH);
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
      updatedAt: new Date(),
      isBlocked: false,
      solvedCount: 0
    };

    const query: FilterQuery<IProblem> = { slug: problemData.slug! };
    const update: UpdateQuery<IProblem> = { $set: problemData };
    const options = { upsert: true, new: true };

    const problem = await this.problemRepository.upsertProblem(query, update, options);
    if (!problem?._id) {
      throw new NotFoundError(ErrorMessages.FAILED_TO_PROCESS_PROBLEM);
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
        throw new BadRequestError(ErrorMessages.UNSUPPORTED_LANGUAGE(code.language));
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

    try {
      await fs.rm(fullProblemDir, { recursive: true });
    } catch (error) {
      console.error(`Failed to delete problem directory ${problemDir}:`, error);
    }

    return problem;
  }

  async getProblemById(id: string): Promise<IProblem | null> {
    const problem = await this.problemRepository.findById(id);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return problem;
  }

  async getProblemBySlug(slug: string): Promise<IProblem | null> {
    const problem = await this.problemRepository.findBySlug(slug);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return problem;
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

  async countProblems(query: FilterQuery<IProblem> = {}): Promise<number> {
    return await this.problemRepository.countDocuments(query);
  }

  async processSpecificProblem(problemDir: string): Promise<IProblem | null> {
    return await this.createProblemFromFiles(problemDir);
  }

  async updateProblemStatus(id: string, status: "premium" | "free"): Promise<IProblem | null> {
    const validStatuses: Array<"premium" | "free"> = ["premium", "free"];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(ErrorMessages.INVALID_STATUS);
    }
    const problem = await this.problemRepository.findById(id);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return this.problemRepository.update(id, { status });
  }

  async blockProblem(id: string): Promise<IProblem | null> {
    const problem = await this.problemRepository.findById(id);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return this.problemRepository.update(id, { isBlocked: true });
  }

  async unblockProblem(id: string): Promise<IProblem | null> {
    const problem = await this.problemRepository.findById(id);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return this.problemRepository.update(id, { isBlocked: false });
  }

  async updateProblem(id: string, updates: UpdateQuery<IProblem>): Promise<IProblem | null> {
    const validDifficulties = ["EASY", "MEDIUM", "HARD"];
    if (updates.difficulty && !validDifficulties.includes(updates.difficulty as string)) {
      throw new BadRequestError(ErrorMessages.INVALID_DIFFICULTY);
    }
    if (updates.isBlocked !== undefined && typeof updates.isBlocked !== "boolean") {
      throw new BadRequestError("isBlocked must be a boolean");
    }
    const problem = await this.problemRepository.findById(id);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return this.problemRepository.update(id, updates);
  }

  async listServerProblems(): Promise<{ problemDir: string; existsInDatabase: boolean }[]> {
    const basePath = process.env.PROBLEM_BASE_PATH || path.join(__dirname, "../problems");
    const problemDirs = await fs.readdir(basePath, { withFileTypes: true })
      .then((dents) =>
        dents
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
      );

    const slugs = problemDirs;
    const existingSlugs = await this.problemRepository
      .find({ slug: { $in: slugs } })
      .then((problems) => problems.map((p) => p.slug));

    return slugs.map((slug) => ({
      problemDir: slug,
      existsInDatabase: existingSlugs.includes(slug),
    }));
  }

  async executeCode( problemId: string, language: string, code: string, userId: string, isRunOnly: boolean = false ): Promise<{ results: TestCaseResult[]; passed: boolean }> {
    const problem = await this.problemRepository.findById(problemId);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);

    const langConfig = getLanguageConfig(language);
    if (!langConfig) throw new BadRequestError(ErrorMessages.UNSUPPORTED_LANGUAGE(language));

    const testCases = await TestCase.find({ problemId: problem._id, status: "active" });
    if (!testCases.length) throw new NotFoundError(ErrorMessages.NO_ACTIVE_TEST_CASES);

    const PISTON_API_URL = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston/execute";
    const results: TestCaseResult[] = [];

    // for 1st 2 test cases
    const testCasesToRun = isRunOnly ? testCases.slice(0, 2) : testCases;

    for (const testCase of testCasesToRun) {
      try {
        const executableCode = langConfig.wrapper(code, testCase.input);
        const response = await axios.post<ExecutionResult>(PISTON_API_URL, {
          language: langConfig.name,
          version: "*",
          files: [{ name: `main.${langConfig.ext}`, content: executableCode }],
          stdin: testCase.input,
        });

        const { stdout, stderr, code: exitCode } = response.data.run;
        const output = stdout.trim();
        const expected = testCase.output.trim();
        const passed = output === expected && exitCode === 0;

        results.push({
          testCaseIndex: testCase.index,
          input: testCase.input,
          expectedOutput: expected,
          actualOutput: output,
          stderr: stderr.trim(),
          passed,
        });
      } catch (error) {
        console.error(`Error executing test case ${testCase.index}:`, error);
        results.push({
          testCaseIndex: testCase.index,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: "",
          stderr: "Execution failed",
          passed: false,
        });
      }
    }

    const allPassed = results.every((r) => r.passed);

    // Save submission to database
    const submission = new Submission({
      userId,
      problemId,
      language,
      code,
      results,
      passed: allPassed,
      isRunOnly,
    });
    await submission.save();

    // If all test cases passed on "Submit" (not "Run"), update user's solved problems
    if (!isRunOnly && allPassed) {
      await User.findByIdAndUpdate(userId, {
        $inc: { problemsSolved: 1 },
        $addToSet: { solvedProblems: problemId },
      });
      await this.problemRepository.update(problemId, { $inc: { solvedCount: 1 } });
    }

    return { results, passed: allPassed };
  }

  async incrementSolvedCount(problemId: string): Promise<IProblem | null> {
    const problem = await this.problemRepository.findById(problemId);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return this.problemRepository.update(problemId, { $inc: { solvedCount: 1 } });
  }
}

export default ProblemService;
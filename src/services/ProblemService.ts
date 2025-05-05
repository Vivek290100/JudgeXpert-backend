import { IProblem } from "../types/IProblem";
import { IProblemService } from "../interfaces/serviceInterfaces/IProblemService";
import { IProblemRepository } from "../interfaces/repositoryInterfaces/IProblemRepository";
import fs from "fs/promises";
import path from "path";
import TestCase from "../models/TestCaseModel";
import DefaultCode from "../models/DefaultCodeModel";
import { Types } from "mongoose";
import { FilterQuery, UpdateQuery } from "mongoose";
import { formatValueForExecution, getLanguageConfig, parseValue, SUPPORTED_LANGUAGES } from "../utils/languages";
import axios from "axios";
import { ExecutionResult } from "../types/IExecution";
import { TestCaseResult } from "../types/ITestCaseResult";
import { BadRequestError, ErrorMessages, NotFoundError } from "../utils/errors";
import Submission from "../models/SubmissionModel";
import User from "../models/UserModel";
import { ISubmission, PopulatedContest, PopulatedUser } from "../types/ISubmission";
import Contest from "../models/ContestModel";
import { log } from "console";

class ProblemService implements IProblemService {
  constructor(private _problemRepository: IProblemRepository) {}

  async createProblemFromFiles(problemDir: string): Promise<IProblem | null> {
    console.log("Processing problem directory:", problemDir);

    const basePath = process.env.PROBLEM_BASE_PATH || path.join(__dirname, "../problems");
    const fullProblemDir = path.join(basePath, problemDir);

    const structurePath = path.join(fullProblemDir, "structure.md");
    const problemPath = path.join(fullProblemDir, "problem.md");
    const inputsDir = path.join(fullProblemDir, "inputs");
    const outputsDir = path.join(fullProblemDir, "outputs");
    const boilerplateDir = path.join(fullProblemDir, "boilerplate");

    // Validate directory structure
    try {
      await Promise.all([
        fs.access(structurePath),
        fs.access(problemPath),
        fs.access(inputsDir),
        fs.access(outputsDir),
        fs.access(boilerplateDir),
      ]);
    } catch (error) {
      console.error("Directory structure validation failed:", error);
      throw new BadRequestError(ErrorMessages.INVALID_PROBLEM_DIR_STRUCTURE(problemDir));
    }

    // Read structure and problem description
    let description: string, structure: string;
    try {
      [description, structure] = await Promise.all([
        fs.readFile(problemPath, "utf-8"),
        fs.readFile(structurePath, "utf-8"),
      ]);
    } catch (error) {
      console.error("Error reading structure.md or problem.md:", error);
      throw new BadRequestError("Failed to read structure.md or problem.md");
    }

    // Normalize newlines and trim the structure content
    structure = structure.replace(/\r\n/g, '\n').trim();

    // Parse structure.md
    const titleMatch = structure.match(/Problem Name: "(.+)"/);
    const functionNameMatch = structure.match(/Function Name: (\w+)/);
    const difficultyMatch = structure.match(/Difficulty: (\w+)/);

    if (!titleMatch || !functionNameMatch || !difficultyMatch) {
      console.error("Failed to parse structure.md: Missing required fields");
      throw new BadRequestError("structure.md is missing required fields (Problem Name, Function Name, or Difficulty)");
    }

    const title = titleMatch[1] || path.basename(problemDir);
    const functionName = functionNameMatch[1] || '';
    const difficulty = difficultyMatch[1]?.toUpperCase() || 'MEDIUM';

    // Parse input structure
    const inputSectionMatch = structure.match(/## Input Structure\n([\s\S]+?)(?=\n##|\n$)/);
    const inputSection = inputSectionMatch ? inputSectionMatch[1].trim() : '';
    const inputFields = inputSection.split('- Input Field:').slice(1);
    const inputStructure = inputFields.map((field, index) => {
      const nameMatch = field.match(/^\s*(\w+)/m);
      const typeMatch = field.match(/Type:\s*([\w<>\[\]]+)/);
      if (!nameMatch || !typeMatch) {
        console.error(`Invalid input structure in structure.md for field ${index}:`, field);
        throw new BadRequestError(`Invalid input structure in structure.md for field ${index}`);
      }
      return { name: nameMatch[1], type: typeMatch[1] };
    });

    // Parse output structure
    const outputSectionMatch = structure.match(/## Output Structure\n([\s\S]+?)(?=\n##|\n$|$)/);
    const outputSection = outputSectionMatch ? outputSectionMatch[1].trim() : '';
    const outputFields = outputSection.split('- Output Field:').slice(1);
    const outputStructure = outputFields.map((field, index) => {
      const nameMatch = field.match(/^\s*(\w+)/m);
      const typeMatch = field.match(/Type:\s*([\w<>\[\]]+)/);
      if (!nameMatch || !typeMatch) {
        console.error(`Invalid output structure in structure.md for field ${index}:`, field);
        throw new BadRequestError(`Invalid output structure in structure.md for field ${index}`);
      }
      return { name: nameMatch[1], type: typeMatch[1] };
    });

    // Parse test cases
    let inputFiles: string[], outputFiles: string[];
    try {
      [inputFiles, outputFiles] = await Promise.all([
        fs.readdir(inputsDir).then(files => files.sort()),
        fs.readdir(outputsDir).then(files => files.sort()),
      ]);
    } catch (error) {
      console.error("Error reading input/output directories:", error);
      throw new BadRequestError("Failed to read input/output directories");
    }

    if (inputFiles.length !== outputFiles.length) {
      console.error("Test case mismatch: Number of input files does not match number of output files");
      throw new BadRequestError(ErrorMessages.TEST_CASE_MISMATCH);
    }

    const testCases: { inputs: { name: string; type: string; value: any }[]; outputs: { name: string; type: string; value: any }[]; index: number }[] = [];
    for (let i = 0; i < inputFiles.length; i++) {
      const testId = parseInt(inputFiles[i].split('.')[0]);
      let inputContent: string, outputContent: string;
      try {
        [inputContent, outputContent] = await Promise.all([
          fs.readFile(path.join(inputsDir, inputFiles[i]), "utf-8"),
          fs.readFile(path.join(outputsDir, outputFiles[i]), "utf-8"),
        ]);
      } catch (error) {
        console.error(`Error reading test case files for index ${testId}:`, error);
        throw new BadRequestError(`Failed to read test case files for index ${testId}`);
      }

      const inputLines = inputContent.trim().split('\n');
      if (inputLines.length !== inputStructure.length) {
        console.error(`Test case ${testId} has incorrect number of inputs: expected ${inputStructure.length}, got ${inputLines.length}`);
        throw new BadRequestError(`Test case ${testId} has incorrect number of inputs`);
      }

      const inputs = inputLines.map((value, idx) => ({
        name: inputStructure[idx].name,
        type: inputStructure[idx].type,
        value: parseValue(value, inputStructure[idx].type),
      }));

      const outputLines = outputContent.trim().split('\n');
      if (outputLines.length !== outputStructure.length) {
        console.error(`Test case ${testId} has incorrect number of outputs: expected ${outputStructure.length}, got ${outputLines.length}`);
        throw new BadRequestError(`Test case ${testId} has incorrect number of outputs`);
      }

      const outputs = outputLines.map((value, idx) => ({
        name: outputStructure[idx].name,
        type: outputStructure[idx].type,
        value: parseValue(value, outputStructure[idx].type),
      }));

      testCases.push({ inputs, outputs, index: testId });
    }

    // Create or update the Problem
    const slug = path.basename(problemDir).toLowerCase().replace(/\./g, '-');
    const problemData: Partial<IProblem> = {
      title,
      description,
      difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
      slug,
      functionName,
      inputStructure,
      outputStructure,
      status: "free",
      memory: 256,
      time: 1000,
      isBlocked: false,
      solvedCount: 0,
    };

    let problem: IProblem | null;
    try {
      const query: FilterQuery<IProblem> = { slug };
      const update: UpdateQuery<IProblem> = { $set: problemData };
      const options = { upsert: true, new: true };
      problem = await this._problemRepository.upsertProblem(query, update, options);
      if (!problem?._id) {
        throw new NotFoundError(ErrorMessages.FAILED_TO_PROCESS_PROBLEM);
      }
    } catch (error) {
      throw new BadRequestError("Failed to save problem to database");
    }

    // Save test cases
    const testCaseIds: Types.ObjectId[] = [];
    try {
      for (const testCase of testCases) {
        const newTestCase = new TestCase({
          problemId: problem._id,
          inputs: testCase.inputs,
          outputs: testCase.outputs,
          index: testCase.index,
          status: "active",
        });
        const savedTestCase = await newTestCase.save();
        testCaseIds.push(savedTestCase._id);
      }
    } catch (error) {
      console.error("Error saving test cases to database:", error);
      throw new BadRequestError("Failed to save test cases to database");
    }

    const defaultCodeIds: Types.ObjectId[] = [];
    try {
      const boilerplateFiles = await fs.readdir(boilerplateDir);
      if (boilerplateFiles.length === 0) {
        console.warn(`No boilerplate files found in directory: ${boilerplateDir}`);
      }

      for (const file of boilerplateFiles) {
        const filePath = path.join(boilerplateDir, file);
        const fileContent = await fs.readFile(filePath, "utf-8");

        const ext = path.extname(file).slice(1);
        const languageConfig = SUPPORTED_LANGUAGES.find(lang => lang.ext === ext);

        if (!languageConfig) {
          console.warn(`Unsupported language extension "${ext}" for file ${file}. Skipping...`);
          continue;
        }

        const defaultCode = new DefaultCode({
          languageName: languageConfig.name,
          problemId: problem._id,
          code: fileContent,
          status: "active",
        });

        const savedDefaultCode = await defaultCode.save();
        defaultCodeIds.push(savedDefaultCode._id);
      }
    } catch (error) {
      console.error("Error processing boilerplate files:", error);
      throw new BadRequestError(`Failed to process boilerplate files in directory ${boilerplateDir}: ${(error as Error).message}`);
    }

    try {
      await this._problemRepository.upsertProblem(
        { _id: problem._id },
        { $set: { testCaseIds, defaultCodeIds } },
        { new: true }
      );
    } catch (error) {
      console.error("Error updating problem with testCaseIds and defaultCodeIds:", error);
      throw new BadRequestError("Failed to update problem with testCaseIds and defaultCodeIds");
    }

    const updatedProblem = await this._problemRepository.findById(problem._id.toString());
    if (!updatedProblem) {
      console.error("Failed to fetch updated problem after processing");
      throw new NotFoundError(ErrorMessages.FAILED_TO_PROCESS_PROBLEM);
    }

    // console.log("Final problem:", updatedProblem);
    return updatedProblem;
  }

  async getProblemById(id: string): Promise<IProblem | null> {
    console.log("Problem:", "problemmmmmmmmmmmmmmm",id)
    const problem = await this._problemRepository.findById(id);
    console.log("Problem:", problem)
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return problem;
  }

  async getProblemBySlug(slug: string): Promise<IProblem | null> {
    const problem = await this._problemRepository.findBySlug(slug);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return problem;
  }

  async getProblemsPaginated(
    page: number,
    limit: number,
    query: FilterQuery<IProblem> = {}
  ): Promise<{ problems: IProblem[]; total: number }> {
    try {
      return await this._problemRepository.findPaginated(page, limit, query);
    } catch (error) {
      throw new Error(`Failed to fetch problems: ${(error as Error).message}`);
    }
  }

  async countProblems(query: FilterQuery<IProblem> = {}): Promise<number> {
    return await this._problemRepository.countDocuments(query);
  }

  async processSpecificProblem(problemDir: string): Promise<IProblem | null> {
    console.log("Processing specific problem:", problemDir);
    return await this.createProblemFromFiles(problemDir);
  }

  async updateProblemStatus(id: string, status: "premium" | "free"): Promise<IProblem | null> {
    const validStatuses: Array<"premium" | "free"> = ["premium", "free"];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(ErrorMessages.INVALID_STATUS);
    }
    const problem = await this._problemRepository.findById(id);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return this._problemRepository.update(id, { status });
  }

  async blockProblem(id: string): Promise<IProblem | null> {
    const problem = await this._problemRepository.findById(id);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return this._problemRepository.update(id, { isBlocked: true });
  }

  async unblockProblem(id: string): Promise<IProblem | null> {
    const problem = await this._problemRepository.findById(id);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return this._problemRepository.update(id, { isBlocked: false });
  }

  async updateProblem(id: string, updates: UpdateQuery<IProblem>): Promise<IProblem | null> {
    const validDifficulties = ["EASY", "MEDIUM", "HARD"];
    if (updates.difficulty && !validDifficulties.includes(updates.difficulty as string)) {
      throw new BadRequestError(ErrorMessages.INVALID_DIFFICULTY);
    }
    if (updates.isBlocked !== undefined && typeof updates.isBlocked !== "boolean") {
      throw new BadRequestError("isBlocked must be a boolean");
    }
    const problem = await this._problemRepository.findById(id);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return this._problemRepository.update(id, updates);
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
    const existingSlugs = await this._problemRepository
      .find({ slug: { $in: slugs } })
      .then((problems) => problems.map((p) => p.slug));

    return slugs.map((slug) => ({
      problemDir: slug,
      existsInDatabase: existingSlugs.includes(slug),
    }));
  }

  async executeCode(
    problemId: string,
    language: string,
    code: string,
    userId: string,
    isRunOnly: boolean = false,
    contestId?: string
  ): Promise<{
    results: TestCaseResult[];
    passed: boolean;
    executionTime: number;
  }> {
    const problem = await this._problemRepository.findById(problemId);
    if (!problem) throw new NotFoundError("Problem not found");

    if (contestId) {
      const contest = await Contest.findById(contestId);
      if (!contest) throw new NotFoundError("Contest not found");

      const now = new Date();
      const endTime = new Date(contest.endTime);
      if (now > endTime) {
        throw new BadRequestError("Contest has ended. You can no longer run or submit code.");
      }
    }

    const langConfig = getLanguageConfig(language);
    if (!langConfig) throw new BadRequestError(`Unsupported language: ${language}`);

    const testCases = await TestCase.find({ problemId: problem._id, status: "active" });
    if (!testCases.length) throw new NotFoundError("No active test cases found");

    const PISTON_API_URL = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston/execute";
    const testCasesToRun = isRunOnly ? testCases.slice(0, 2) : testCases;
    const functionName = problem.functionName || "solution";

    const results: TestCaseResult[] = [];
    let totalExecutionTime = 0;
    let maxMemoryUsed = 0;

    for (const testCase of testCasesToRun) {
      try {
        const inputValues = testCase.inputs.map(i => formatValueForExecution(i.value, i.type)).join("\n");
        const executableCode = langConfig.wrapper(code, inputValues, functionName, problem.inputStructure);

        const start = Date.now();
        const response = await axios.post<ExecutionResult>(PISTON_API_URL, {
          language: langConfig.name,
          version: langConfig.version,
          files: [{ name: `main.${langConfig.ext}`, content: executableCode }],
          timeLimit: problem.time / 1000,
          memoryLimit: problem.memory,
        });
        const duration = Date.now() - start;

        totalExecutionTime += duration;

        const { stdout, stderr, code: exitCode } = response.data.run;

        let outputLines: string[];
        try {
          const parsed = JSON.parse(stdout.trim());
          outputLines = testCase.outputs.map((o, i) =>
            formatValueForExecution(Array.isArray(parsed) ? parsed[i] : parsed, o.type)
          );
        } catch {
          outputLines = stdout.trim().split("\n").filter(line => line.trim());
        }

        const expectedLines = testCase.outputs.map(o =>
          formatValueForExecution(o.value, o.type)
        );

        const passed = outputLines.length === expectedLines.length &&
          outputLines.every((out, i) => {
            const expected = expectedLines[i];
            const type = testCase.outputs[i].type;
            if (type.startsWith("array<")) {
              const normalize = (s: string) => JSON.stringify(JSON.parse(s).sort());
              return normalize(out) === normalize(expected);
            }
            return out.trim() === expected.trim();
          }) && exitCode === 0;

        results.push({
          testCaseIndex: testCase.index,
          input: inputValues,
          expectedOutput: expectedLines.join("\n"),
          actualOutput: outputLines.join("\n"),
          stderr: stderr.trim(),
          passed,
        });
      } catch (err) {
        console.error(`Execution failed for test case ${testCase.index}`, err);
        results.push({
          testCaseIndex: testCase.index,
          input: testCase.inputs.map(i => formatValueForExecution(i.value, i.type)).join("\n"),
          expectedOutput: testCase.outputs.map(o => formatValueForExecution(o.value, o.type)).join("\n"),
          actualOutput: "",
          stderr: err instanceof Error ? err.message : "Execution failed",
          passed: false,
        });
      }
    }

    const allPassed = results.every(r => r.passed);

    if (!isRunOnly) {
      await new Submission({
        userId,
        problemId,
        language,
        code,
        results,
        passed: allPassed,
        executionTime: totalExecutionTime,
        memoryUsed: maxMemoryUsed,
        contestId: contestId || null,
      }).save();

      if (allPassed) {
        const user = await User.findById(userId).select("solvedProblems");
        if (!user) throw new NotFoundError("User not found");

        const alreadySolved = user.solvedProblems.some(id => id.toString() === problemId);
        if (!alreadySolved) {
          await User.findByIdAndUpdate(userId, {
            $inc: { problemsSolved: 1 },
            $addToSet: { solvedProblems: problemId },
          });
          await this._problemRepository.incrementSolvedCount(problemId);
        }
      }
    }

    return { results, passed: allPassed, executionTime: totalExecutionTime };
  }
  
  async incrementSolvedCount(problemId: string): Promise<IProblem | null> {
    const problem = await this._problemRepository.findById(problemId);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    return this._problemRepository.update(problemId, { $inc: { solvedCount: 1 } });
  }


  async getUserSubmissions(userId: string, problemSlug?: string): Promise<ISubmission[]> {
    const query: FilterQuery<ISubmission> = { userId };
  
    if (problemSlug) {
      const problem = await this._problemRepository.findBySlug(problemSlug);
      if (!problem) {
        throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
      }
      query.problemId = problem._id.toString();
    }
  
    const submissions = await Submission.find(query)
      .populate("problemId", "title slug")
      .populate<{ contestId: PopulatedContest | null }>("contestId", "title")
      .sort({ submittedAt: -1 })
      .lean()
      .exec();
  
    return submissions;
  }
}

export default ProblemService;
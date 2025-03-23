import { Request, Response } from "express";
import { handleError, sendResponse } from "../utils/responseUtils";
import { IProblemService } from "../interfaces/serviceInterfaces/IProblemService";
import fs from "fs/promises";
import path from "path";
import { generateBoilerplateForProblem } from "../scripts/generateBoilerplate";
import Problem from "../models/ProblemModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import User from "../models/UserModel";
import { StatusCode } from "../utils/statusCode";
import { SuccessMessages } from "../utils/messages";
import { BadRequestError, ErrorMessages, NotFoundError } from "../utils/errors";

export const filterProblemResponse = (problem: any) => ({
  id: problem._id.toString(),
  _id: problem._id.toString(),
  title: problem.title,
  slug: problem.slug,
  difficulty: problem.difficulty,
  status: problem.status,
  updatedAt: problem.updatedAt,
  description: problem.description || "",
  defaultCodeIds: problem.defaultCodeIds || [],
  testCaseIds: problem.testCaseIds || [],
  isBlocked: problem.isBlocked,
});

class ProblemController {
  constructor(private problemService: IProblemService) {}

  async createProblem(req: Request, res: Response): Promise<void> {
    try {
      const { problemDir } = req.body;
      if (!problemDir || typeof problemDir !== "string") {
        throw new BadRequestError(ErrorMessages.PROBLEM_DIR_REQUIRED);
      }

      const problem = await this.problemService.createProblemFromFiles(problemDir);
      if (!problem) {
        throw new NotFoundError(ErrorMessages.FAILED_TO_PROCESS_PROBLEM);
      }

      sendResponse(res, {
        success: true,
        status: StatusCode.CREATED,
        message: SuccessMessages.PROBLEM_CREATED,
        data: { problem: filterProblemResponse(problem) },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getProblemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        throw new BadRequestError(ErrorMessages.PROBLEM_ID_REQUIRED);
      }

      const problem = await this.problemService.getProblemById(id);
      if (!problem) {
        throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
      }

      const populatedProblem = await Problem.findById(problem._id)
        .populate("defaultCodeIds")
        .populate("testCaseIds");

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PROBLEM_FETCHED,
        data: { problem: filterProblemResponse(populatedProblem || problem) },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getProblemBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      if (!slug || typeof slug !== "string") {
        throw new BadRequestError(ErrorMessages.INVALID_SLUG);
      }

      const problem = await this.problemService.getProblemBySlug(slug);
      if (!problem) {
        throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
      }

      const populatedProblem = await Problem.findById(problem._id)
        .populate("defaultCodeIds")
        .populate("testCaseIds");

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PROBLEM_FETCHED,
        data: {
          problem: {
            ...filterProblemResponse(populatedProblem || problem),
            defaultCodes: populatedProblem?.defaultCodeIds || [],
            testCases: populatedProblem?.testCaseIds.slice(0, 2) || [],
          },
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async updateProblemStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || typeof id !== "string") {
        throw new BadRequestError(ErrorMessages.PROBLEM_ID_REQUIRED);
      }
      if (!["premium", "free"].includes(status)) {
        throw new BadRequestError(ErrorMessages.INVALID_STATUS);
      }

      const problem = await this.problemService.updateProblemStatus(id, status as "premium" | "free");
      if (!problem) {
        throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
      }

      const populatedProblem = await Problem.findById(id)
        .populate("defaultCodeIds")
        .populate("testCaseIds");

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PROBLEM_STATUS_UPDATED,
        data: { problem: filterProblemResponse(populatedProblem || problem) },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async processSpecificProblem(req: Request, res: Response): Promise<void> {
    try {
      const { problemDir } = req.body;
      if (!problemDir || typeof problemDir !== "string") {
        throw new BadRequestError(ErrorMessages.PROBLEM_DIR_REQUIRED);
      }

      const problem = await this.problemService.processSpecificProblem(problemDir);
      if (!problem) {
        throw new NotFoundError(ErrorMessages.FAILED_TO_PROCESS_PROBLEM);
      }

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PROBLEM_PROCESSED,
        data: { problem: filterProblemResponse(problem) },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getProblems(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = "1", limit = "10", search = "", difficulty, status } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        throw new BadRequestError(ErrorMessages.INVALID_PAGE_OR_LIMIT);
      }

      const query: any = {};
      if (search) query.title = { $regex: search, $options: "i" };
      if (difficulty && ["EASY", "MEDIUM", "HARD"].includes(difficulty as string)) {
        query.difficulty = difficulty;
      }
      if (status && ["premium", "free"].includes(status as string)) {
        query.status = status;
      }

      const userId = req.user?.userId;
      let problemsSolvedCount = 0;
      let isAdmin = false;

      if (userId) {
        const user = await User.findById(userId).select("problemsSolved role");
        if (!user) {
          throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
        }
        problemsSolvedCount = user.problemsSolved || 0;
        isAdmin = user.role === "admin";
      }

      if (!isAdmin) {
        query.isBlocked = { $ne: true };
      }

      const problems = await Problem.find(query)
        .populate("defaultCodeIds")
        .populate("testCaseIds");

      const total = problems.length;

      const paginatedProblems = problems.slice((pageNum - 1) * limitNum, pageNum * limitNum);
      const normalizedProblems = paginatedProblems.map((problem) => filterProblemResponse(problem));

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PROBLEMS_FETCHED,
        data: {
          problems: normalizedProblems,
          problemsSolvedCount,
          total,
          totalPages: Math.ceil(total / limitNum),
          currentPage: pageNum,
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async generateAllBoilerplate(req: Request, res: Response): Promise<void> {
    try {
      const basePath = process.env.PROBLEM_BASE_PATH || path.join(__dirname, "../problems");
      const problemDirs = (await fs.readdir(basePath, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      await Promise.all(problemDirs.map((problemDir) => generateBoilerplateForProblem(problemDir)));

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.BOILERPLATE_ALL_GENERATED,
        data: null,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async generateSpecificBoilerplate(req: Request, res: Response): Promise<void> {
    try {
      const { problemDir } = req.body;
      if (!problemDir || typeof problemDir !== "string") {
        throw new BadRequestError(ErrorMessages.PROBLEM_DIR_REQUIRED);
      }

      await generateBoilerplateForProblem(problemDir);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.BOILERPLATE_SPECIFIC_GENERATED,
        data: null,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async updateProblem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id || typeof id !== "string") {
        throw new BadRequestError(ErrorMessages.PROBLEM_ID_REQUIRED);
      }

      const validDifficulties = ["EASY", "MEDIUM", "HARD"];
      if (updates.difficulty && !validDifficulties.includes(updates.difficulty)) {
        throw new BadRequestError(ErrorMessages.INVALID_DIFFICULTY);
      }

      const problem = await this.problemService.updateProblem(id, updates);
      if (!problem) {
        throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
      }

      const populatedProblem = await Problem.findById(id)
        .populate("defaultCodeIds")
        .populate("testCaseIds");

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PROBLEM_UPDATED,
        data: { problem: filterProblemResponse(populatedProblem || problem) },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async unlinkProblem(req: Request, res: Response): Promise<void> {
    try {
      const { problemDir } = req.params;
      if (!problemDir || typeof problemDir !== "string") {
        throw new BadRequestError(ErrorMessages.INVALID_INPUT("problemDir"));
      }

      const basePath = process.env.PROBLEM_BASE_PATH || path.join(__dirname, "../problems");
      const fullProblemDir = path.join(basePath, problemDir);

      await fs.rm(fullProblemDir, { recursive: true });

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PROBLEM_UNLINKED(problemDir),
        data: null,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async blockProblem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        throw new BadRequestError(ErrorMessages.PROBLEM_ID_REQUIRED);
      }

      const problem = await this.problemService.blockProblem(id);
      if (!problem) {
        throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
      }

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PROBLEM_BLOCKED,
        data: { problem: filterProblemResponse(problem) },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async unblockProblem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        throw new BadRequestError(ErrorMessages.PROBLEM_ID_REQUIRED);
      }

      const problem = await this.problemService.unblockProblem(id);
      if (!problem) {
        throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
      }

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PROBLEM_UNBLOCKED,
        data: { problem: filterProblemResponse(problem) },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async executeCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { problemId, language, code } = req.body;
      if (!problemId || !language || !code) {
        throw new BadRequestError(ErrorMessages.EXECUTION_FIELDS_REQUIRED);
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw new BadRequestError(ErrorMessages.USER_ID_REQUIRED);
      }

      const { results, passed } = await this.problemService.executeCode(problemId, language, code);

      if (passed) {
        await User.findByIdAndUpdate(userId, { $inc: { problemsSolved: 1 } });
      }

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: passed ? SuccessMessages.CODE_EXECUTION_PASSED : SuccessMessages.CODE_EXECUTION_FAILED,
        data: { results },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

export default ProblemController;
import { Request, Response } from "express";
import { filterProblemResponse, handleError, sendResponse } from "../utils/responseUtils";
import { IProblemService } from "../interfaces/serviceInterfaces/IProblemService";
import Problem from "../models/ProblemModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import User from "../models/UserModel";
import { StatusCode } from "../utils/statusCode";
import { SuccessMessages } from "../utils/messages";
import { BadRequestError, ErrorMessages, NotFoundError } from "../utils/errors";
import { IProblem } from "../types/IProblem";
import { FilterQuery } from "mongoose";
import { ISubmission } from "../types/ISubmission";
import fs from "fs/promises";
import path from "path";

interface AdminAuthRequest extends AuthRequest {
  user?: { userId: string; role?: string };
}

class ProblemController {
  constructor(private problemService: IProblemService) {}

  async createProblem(req: Request, res: Response): Promise<void> {
    console.log("controller for problem");
    
    try {
      const { problemDir } = req.body;
      if (!problemDir || typeof problemDir !== "string") {
        throw new BadRequestError(ErrorMessages.PROBLEM_DIR_REQUIRED);
      }

      const problem = await this.problemService.createProblemFromFiles(problemDir);
      console.log("Created problem:", problem);
      
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
      console.log("Error in createProblem:", error);
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
    console.log("Processing specific problem request");
    console.log("Request body:", req.body);
    try {
      const { problemDir } = req.body;
      console.log("Problem directory:", problemDir);
      if (!problemDir || typeof problemDir !== "string") {
        throw new BadRequestError(ErrorMessages.PROBLEM_DIR_REQUIRED);
      }

      const problem = await this.problemService.processSpecificProblem(problemDir);
      console.log("Processed problem:", problem);

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

  async getProblems(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const difficulty = req.query.difficulty as string;
      const status = req.query.status as string;
      const solved = req.query.solved as string;

      const query: FilterQuery<IProblem> = {};
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (userRole !== "admin") {
        query.isBlocked = { $ne: true };
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
        ];
      }
      if (difficulty && ["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
        query.difficulty = difficulty;
      }
      if (status && ["premium", "free"].includes(status)) {
        query.status = status;
      }

      let userProblemStatus: { problemId: string; solved: boolean }[] = [];
      let problemsSolvedCount = 0;

      if (userId) {
        const user = await User.findById(userId).select("problemsSolved solvedProblems");
        if (!user) {
          throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
        }
        problemsSolvedCount = user.problemsSolved || 0;
        userProblemStatus = (user.solvedProblems || []).map((problemId) => ({
          problemId: problemId.toString(),
          solved: true,
        }));
      }

      const { problems, total } = await this.problemService.getProblemsPaginated(page, limit, query);
      // console.log("gggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",problems)

      if (solved === "true" || solved === "false") {
        const solvedFilter = solved === "true";
        const solvedProblemIds = userProblemStatus
          .filter((status) => status.solved === solvedFilter)
          .map((status) => status.problemId);
        if (solvedProblemIds.length > 0) {
          if (solvedFilter) {
            query._id = { $in: solvedProblemIds };
          } else {
            query._id = { $nin: solvedProblemIds };
          }
          const filteredResult = await this.problemService.getProblemsPaginated(page, limit, query);
          const totalFiltered = await this.problemService.countProblems(query);
          sendResponse(res, {
            success: true,
            status: StatusCode.SUCCESS,
            message: SuccessMessages.PROBLEMS_FETCHED,
            data: {
              problems: filteredResult.problems.map(filterProblemResponse),
              userProblemStatus,
              problemsSolvedCount,
              total: totalFiltered,
              totalPages: Math.ceil(totalFiltered / limit),
              currentPage: page,
            },
          });
          return;
        } else if (solvedFilter) {
          sendResponse(res, {
            success: true,
            status: StatusCode.SUCCESS,
            message: SuccessMessages.PROBLEMS_FETCHED,
            data: {
              problems: [],
              userProblemStatus,
              problemsSolvedCount,
              total: 0,
              totalPages: 0,
              currentPage: page,
            },
          });
          return;
        }
      }

      const normalizedProblems = problems.map(filterProblemResponse);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PROBLEMS_FETCHED,
        data: {
          problems: normalizedProblems,
          userProblemStatus,
          problemsSolvedCount,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async generateAllBoilerplate(req: Request, res: Response): Promise<void> {
    try {
      const problems = await this.problemService.getProblemsPaginated(1, 1000);
      for (const problem of problems.problems) {
        await this.problemService.processSpecificProblem(problem.slug);
      }

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

      await this.problemService.processSpecificProblem(problemDir);

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
      const { problemId, language, code, isRunOnly = false } = req.body; // Extract code directly
      const userId = req.user?.userId;
  
      if (!userId) {
        throw new BadRequestError(ErrorMessages.USER_ID_REQUIRED);
      }
  
      if (!code) {
        throw new BadRequestError("Code is required");
      }
  
      console.log("pController", problemId, language, code, isRunOnly, userId);
  
      const { results, passed } = await this.problemService.executeCode(problemId, language, code, userId, isRunOnly);
  
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

  async getUserSubmissions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new BadRequestError(ErrorMessages.USER_ID_REQUIRED);
      }

      const { problemSlug } = req.query;
      let slug: string | undefined;

      if (problemSlug !== undefined) {
        if (typeof problemSlug !== "string") {
          throw new BadRequestError(ErrorMessages.INVALID_INPUT("problemSlug must be a string"));
        }
        slug = problemSlug;
      }

      const submissions = await this.problemService.getUserSubmissions(userId, slug);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.SUBMISSIONS_FETCHED,
        data: {
          submissions: submissions.map(sub => ({
            _id: sub._id,
            language: sub.language,
            passed: sub.passed,
            testCasesPassed: sub.results.filter(r => r.passed).length,
            totalTestCases: sub.results.length,
            code: sub.code,
            createdAt: sub.submittedAt.toISOString(),
          })),
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

export default ProblemController;
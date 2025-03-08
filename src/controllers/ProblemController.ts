// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\controllers\ProblemController.ts
import { Request, Response } from "express";
import { sendResponse } from "../utils/responseUtils";
import { IProblemService } from "../interfaces/IProblemService"; // Import the interface
import fs from "fs/promises";
import path from "path";
import { generateBoilerplateForProblem } from "../scripts/generateBoilerplate";
import Problem from "../models/ProblemModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import User from "../models/UserModel";
import { IUser } from "../interfaces/IUser";

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
});

class ProblemController {
  constructor(private problemService: IProblemService) {} // Change to IProblemService

  async createProblem(req: Request, res: Response): Promise<void> {
    try {
      const { problemDir } = req.body;
      if (!problemDir || typeof problemDir !== "string") {
        throw new Error("problemDir is required and must be a string");
      }

      const problem = await this.problemService.createProblemFromFiles(problemDir);
      if (!problem) throw new Error("Failed to create or update problem: no document returned");

      sendResponse(res, {
        success: true,
        status: 201,
        message: "Problem created successfully",
        data: { problem: filterProblemResponse(problem) },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred during problem creation",
        data: null,
      });
    }
  }

  // ... (rest of the methods remain unchanged, just ensure they use this.problemService)
  async getProblemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") throw new Error("Invalid problem ID");

      const problem = await this.problemService.getProblemById(id);
      if (!problem) throw new Error("Problem not found");

      const populatedProblem = await Problem.findById(problem._id)
        .populate("defaultCodeIds")
        .populate("testCaseIds");

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problem fetched successfully",
        data: { problem: filterProblemResponse(populatedProblem || problem) },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 404,
        message: error.message || "An error occurred while fetching the problem",
        data: null,
      });
    }
  }

  async getProblemBySlug(req: Request, res: Response): Promise<void> {
    console.log("its getProblemBySlug");
    
    try {
      const { slug } = req.params;
      console.log("444444444",slug);
      
      if (!slug || typeof slug !== "string") throw new Error("Invalid slug");

      const problem = await this.problemService.getProblemBySlug(slug);
      if (!problem) throw new Error("Problem not found");

      const populatedProblem = await Problem.findById(problem._id)
        .populate("defaultCodeIds")
        .populate("testCaseIds");

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problem fetched successfully",
        data: {
          problem: {
            ...filterProblemResponse(populatedProblem || problem),
            defaultCodes: populatedProblem?.defaultCodeIds || [],
            testCases: populatedProblem?.testCaseIds.slice(0, 2) || [],
          },
        },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 404,
        message: error.message || "An error occurred while fetching the problem",
        data: null,
      });
    }
  }

  async updateProblemStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || typeof id !== "string") throw new Error("Invalid problem ID");
      if (!["premium", "free"].includes(status)) {
        throw new Error("Invalid status value; must be 'premium' or 'free'");
      }

      const problem = await this.problemService.updateProblemStatus(id, status as "premium" | "free");
      if (!problem) throw new Error("Problem not found");

      const populatedProblem = await Problem.findById(id)
        .populate("defaultCodeIds")
        .populate("testCaseIds");

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problem status updated successfully",
        data: { problem: filterProblemResponse(populatedProblem || problem) },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred while updating problem status",
        data: null,
      });
    }
  }

  async processSpecificProblem(req: Request, res: Response): Promise<void> {
    try {
      const { problemDir } = req.body;
      if (!problemDir || typeof problemDir !== "string") {
        throw new Error("problemDir is required and must be a string");
      }

      const problem = await this.problemService.processSpecificProblem(problemDir);
      if (!problem) throw new Error("Failed to process problem: no document returned");

      sendResponse(res, {
        success: true,
        status: 201,
        message: "Problem processed successfully",
        data: { problem: filterProblemResponse(problem) },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred while processing the problem",
        data: null,
      });
    }
  }

  async getProblems(req: AuthRequest, res: Response): Promise<void> {
    const { page = "1", limit = "10", search = "", difficulty, status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
  
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      throw new Error("Invalid page or limit parameters");
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
  
    try {
      // Fetch problems based on query
      const problems = await Problem.find(query)
        .populate("defaultCodeIds")
        .populate("testCaseIds");
  
      const total = problems.length;
  
      // Fetch the user's problemsSolved count if authenticated
      let problemsSolvedCount = 0;
      if (userId) {
        const user = await User.findById(userId).select("problemsSolved");
        if (!user) {
          throw new Error("User not found");
        }
        problemsSolvedCount = user.problemsSolved || 0; // This is the count for the particular user
      }
  
      // Paginate the problems
      const paginatedProblems = problems.slice((pageNum - 1) * limitNum, pageNum * limitNum);
      const normalizedProblems = paginatedProblems.map((problem) => filterProblemResponse(problem));
  
      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problems fetched successfully",
        data: {
          problems: normalizedProblems,
          problemsSolvedCount, // The count of problems solved by this user
          total, // Total problems matching the query
          totalPages: Math.ceil(total / limitNum),
          currentPage: pageNum,
        },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 500,
        message: error.message || "An error occurred while fetching problems",
        data: null,
      });
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
        status: 200,
        message: "All boilerplates generated successfully",
        data: null,
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 500,
        message: error.message || "An error occurred while generating boilerplates",
        data: null,
      });
    }
  }

  async generateSpecificBoilerplate(req: Request, res: Response): Promise<void> {
    try {
      const { problemDir } = req.body;
      if (!problemDir || typeof problemDir !== "string") {
        throw new Error("problemDir is required and must be a string");
      }

      await generateBoilerplateForProblem(problemDir);

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Boilerplate generated successfully for the problem",
        data: null,
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred while generating boilerplate",
        data: null,
      });
    }
  }

  async updateProblem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id || typeof id !== "string") throw new Error("Invalid problem ID");

      const validDifficulties = ["EASY", "MEDIUM", "HARD"];
      if (updates.difficulty && !validDifficulties.includes(updates.difficulty)) {
        throw new Error("Invalid difficulty value");
      }

      const problem = await this.problemService.updateProblem(id, updates);
      if (!problem) throw new Error("Problem not found");

      const populatedProblem = await Problem.findById(id)
        .populate("defaultCodeIds")
        .populate("testCaseIds");

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problem updated successfully",
        data: { problem: filterProblemResponse(populatedProblem || problem) },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred while updating problem",
        data: null,
      });
    }
  }
}

export default ProblemController;
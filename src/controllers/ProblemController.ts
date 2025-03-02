import { Request, Response } from "express";
import { sendResponse } from "../utils/responseUtils";
import ProblemService from "../services/ProblemService";
import fs from "fs";
import path from "path";
import { generateBoilerplateForProblem } from "../scripts/generateBoilerplate";
import Problem from "../models/ProblemModel";

export const filterProblemResponse = (problem: any) => ({
  id: problem._id.toString(),
  _id: problem._id.toString(), // Include both for compatibility
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
  constructor(private problemService: ProblemService) {}

  async createProblem(req: Request, res: Response): Promise<void> {
    try {
      const problemDir = req.body.problemDir;
      if (!problemDir) throw new Error("problemDir is required");

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

  async getProblemById(req: Request, res: Response): Promise<void> {
    try {
      const problem = await Problem.findById(req.params.id)
        .populate("defaultCodeIds")
        .populate("testCaseIds");
      if (!problem) throw new Error("Problem not found");

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problem fetched successfully",
        data: { problem: filterProblemResponse(problem) },
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
    try {
      const problem = await this.problemService.getProblemBySlug(req.params.slug);
      if (!problem) throw new Error("Problem not found");

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problem fetched successfully",
        data: { problem: filterProblemResponse(problem) },
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

      if (!["premium", "free"].includes(status)) {
        throw new Error("Invalid status value");
      }

      const problem = await this.problemService.updateProblemStatus(id, status as "premium" | "free");
      if (!problem) throw new Error("Problem not found");

      // Populate the updated problem for the response
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
      const problemDir = req.body.problemDir;
      if (!problemDir) throw new Error("problemDir is required");

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

  async getProblems(req: Request, res: Response): Promise<void> {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = search ? { title: { $regex: search, $options: "i" } } : {};

    try {
      const problems = await Problem.find(query)
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .populate("defaultCodeIds")
        .populate("testCaseIds");

      const total = await Problem.countDocuments(query);

      const normalizedProblems = problems.map((problem) => filterProblemResponse(problem));

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problems fetched successfully",
        data: {
          problems: normalizedProblems,
          total,
          totalPages: Math.ceil(total / +limit),
          currentPage: +page,
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
      const problemDirs = fs.readdirSync(basePath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const problemDir of problemDirs) {
        await generateBoilerplateForProblem(problemDir);
      }

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
      const problemDir = req.body.problemDir;
      if (!problemDir) throw new Error("problemDir is required");

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
}

export default ProblemController;
// src/controllers/ProblemController.ts (unchanged, but verified)
import { Request, Response } from "express";
import { sendResponse } from "../utils/responseUtils";
import ProblemService from "../services/ProblemService";
import fs from "fs"; // Node.js built-in module
import path from "path"; // Node.js built-in module
import { generateBoilerplateForProblem } from "../scripts/generateBoilerplate";
import { FilterQuery } from "mongoose";
import { IProblem } from "../interfaces/IProblem";

class ProblemController {
  constructor(private problemService: ProblemService) {}

  async createProblem(req: Request, res: Response): Promise<void> {
    try {
      const problemDir = req.body.problemDir;
      console.log("problem controller problemDir",problemDir);
      
      if (!problemDir) {
        throw new Error("problemDir is required");
      }
      console.log("problemDir", problemDir);

      const problem = await this.problemService.createProblemFromFiles(problemDir);
      console.log("problemproblem",problem);
      
      if (!problem) {
        throw new Error("Failed to create or update problem: no document returned");
      }

      sendResponse(res, {
        success: true,
        status: 201,
        message: "Problem created successfully",
        data: { problem: { id: problem._id, title: problem.title, slug: problem.slug } },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 400,
        message: error.message || "Failed to create problem",
        data: null,
      });
    }
  }

  async getProblemById(req: Request, res: Response): Promise<void> {
    try {
      const problem = await this.problemService.getProblemById(req.params.id);
      if (!problem) throw new Error("Problem not found");

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problem fetched successfully",
        data: { problem },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 404,
        message: error.message || "Problem not found",
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
        data: { problem },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 404,
        message: error.message || "Problem not found",
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
  
      if (!problem) {
        throw new Error("Problem not found");
      }
  
      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problem status updated successfully",
        data: { problem },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 400,
        message: error.message || "Failed to update problem status",
        data: null,
      });
    }
  }

  // Process a single problem (admin-only)
  async processSpecificProblem(req: Request, res: Response): Promise<void> {
    try {
      console.log("inside the processSpecificProblem controller");
      
      const problemDir = req.body.problemDir;
      console.log("problemDir", problemDir);
      
      if (!problemDir) {
        throw new Error("problemDir is required");
      }

      const problem = await this.problemService.processSpecificProblem(problemDir);
      console.log("problem", problem);
      
      if (!problem) {
        throw new Error("Failed to process problem: no document returned");
      }

      sendResponse(res, {
        success: true,
        status: 201,
        message: "Problem processed successfully",
        data: { problem: { id: problem._id, title: problem.title, slug: problem.slug } },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 400,
        message: error.message || "Failed to process problem",
        data: null,
      });
    }
  }

  async getProblems(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
  
      const query: FilterQuery<IProblem> = {
        // Remove or update status filter based on your needs
        // Option 1: No status filter (fetch all problems)
        // Option 2: Filter for "free" problems only (e.g., for non-premium users)
        // status: "free",
        // Option 3: Filter for both "premium" and "free"
        status: { $in: ["premium", "free"] },
      };
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
        ];
      }
  
      const { problems, total } = await this.problemService.getProblemsPaginated(page, limit, query);
      console.log("444444444444", problems, total, limit, page);
  
      sendResponse(res, {
        success: true,
        status: 200,
        message: "Problems fetched successfully",
        data: {
          problems,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 500,
        message: error.message || "Failed to fetch problems",
        data: null,
      });
    }
  }

 

  // Generate boilerplate for all problems (admin-only)
  async generateAllBoilerplate(req: Request, res: Response): Promise<void> {
    try {
      const basePath = process.env.PROBLEM_BASE_PATH || path.join(__dirname, "../problems");
      const problemDirs = fs.readdirSync(basePath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

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
        status: 500,
        message: error.message || "Failed to generate boilerplates",
        data: null,
      });
    }
  }

  // Generate boilerplate for a specific problem (admin-only)
  async generateSpecificBoilerplate(req: Request, res: Response): Promise<void> {
    try {
      const problemDir = req.body.problemDir;
      if (!problemDir) {
        throw new Error("problemDir is required");
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
        status: 400,
        message: error.message || "Failed to generate boilerplate",
        data: null,
      });
    }
  }
}

export default ProblemController;
// Backend\src\controllers\ContestController.ts
import { Request, Response } from "express";
import { IContestService } from "../interfaces/serviceInterfaces/IContestService";
import { sendResponse, handleError } from "../utils/responseUtils";
import { StatusCode } from "../utils/statusCode";
import { SuccessMessages } from "../utils/messages";
import { BadRequestError, ErrorMessages } from "../utils/errors";

interface AuthRequest extends Request {
  user?: { userId: string, userName: string },
}

class ContestController {
  constructor(private contestService: IContestService) {}

  async getContests(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.contestService.getContests(page, limit);
      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.CONTESTS_FETCHED,
        data: result,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getContestById(req: Request, res: Response): Promise<void> {
    try {
      const { contestId } = req.params;
      const contest = await this.contestService.getContestById(contestId);
      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.CONTESTS_FETCHED,
        data: { contest },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async registerForContest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { contestId } = req.params;
      const userId = req.user?.userId;
      if (!userId) throw new BadRequestError(ErrorMessages.UNAUTHORIZED_ACCESS);
      const result = await this.contestService.registerForContest(contestId, userId);
      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: result.message,
        data: {
          message: result.message,
          user: { _id: userId, userName: req.user?.userName || "Unknown" },
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async updateContestStatus(req: Request, res: Response): Promise<void> {
    try {
      const { contestId } = req.params;
      const { isBlocked } = req.body;
      if (typeof isBlocked !== "boolean") throw new BadRequestError("isBlocked must be a boolean");
      const updatedContest = await this.contestService.updateContestStatus(contestId, isBlocked);
      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Contest status updated successfully",
        data: updatedContest,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getAdminContests(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const result = await this.contestService.getContests(page, limit, {
        title: { $regex: search, $options: "i" },
      });
      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.CONTESTS_FETCHED,
        data: result,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async createContest(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, startTime, endTime, problems } = req.body;
      const contestData = { title, description, startTime, endTime, problems };
      const newContest = await this.contestService.createContest(contestData);
      sendResponse(res, {
        success: true,
        status: StatusCode.CREATED,
        message: "Contest created successfully",
        data: newContest,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getRegisteredContests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new BadRequestError(ErrorMessages.UNAUTHORIZED_ACCESS);
      const contestIds = await this.contestService.getRegisteredContests(userId);
      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Registered contests fetched successfully",
        data: { contestIds },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

export default ContestController;
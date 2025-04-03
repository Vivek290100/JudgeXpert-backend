import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { IDiscussionService } from "../interfaces/serviceInterfaces/IDiscussionService";
import { handleError, sendResponse } from "../utils/responseUtils";
import { StatusCode } from "../utils/statusCode";
import { SuccessMessages } from "../utils/messages";
import { BadRequestError, ErrorMessages } from "../utils/errors";

class DiscussionController {
  constructor(private discussionService: IDiscussionService) {}

  async createDiscussion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new BadRequestError(ErrorMessages.USER_ID_REQUIRED);
      }

      const { problemId, message } = req.body;
      if (!problemId || !message) {
        throw new BadRequestError(ErrorMessages.ALL_FIELDS_REQUIRED);
      }

      const discussion = await this.discussionService.createDiscussion(
        problemId,
        userId,
        message
      );

      sendResponse(res, {
        success: true,
        status: StatusCode.CREATED,
        message: SuccessMessages.DISCUSSION_CREATED,
        data: { discussion },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async addReply(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new BadRequestError(ErrorMessages.USER_ID_REQUIRED);
      }

      const { discussionId, message } = req.body;
      if (!discussionId || !message) {
        throw new BadRequestError(ErrorMessages.ALL_FIELDS_REQUIRED);
      }

      const discussion = await this.discussionService.addReply(
        discussionId,
        userId,
        message
      );

      sendResponse(res, {
        success: true,
        status: StatusCode.CREATED,
        message: "Reply added successfully",
        data: { discussion },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getDiscussions(req: Request, res: Response): Promise<void> {
    try {
      const { problemId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      console.log("11111111",problemId,page,limit);
      

      if (!problemId) {
        throw new BadRequestError(ErrorMessages.PROBLEM_ID_REQUIRED);
      }

      const { discussions, total } =
        await this.discussionService.getDiscussionsByProblemId(
          problemId,
          page,
          limit
        );

        console.log("33333333",discussions,total,problemId,page,limit);
        

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.DISCUSSIONS_FETCHED,
        data: {
          discussions,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

export default DiscussionController;
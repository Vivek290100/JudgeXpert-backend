import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { IDiscussionService } from "../interfaces/serviceInterfaces/IDiscussionService";
import { handleError, sendResponse } from "../utils/responseUtils";
import { StatusCode } from "../utils/statusCode";
import { SuccessMessages } from "../utils/messages";
import { BadRequestError, ErrorMessages } from "../utils/errors";
import Discussion from "../models/DiscussionModel"; // Import the Discussion model for population

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

      // Populate the userId field before sending the response
      const populatedDiscussion = await Discussion.findById(discussion._id)
        .populate("userId", "userName profileImage")
        .exec();

      if (!populatedDiscussion) {
        throw new Error("Failed to populate discussion");
      }

      sendResponse(res, {
        success: true,
        status: StatusCode.CREATED,
        message: SuccessMessages.DISCUSSION_CREATED,
        data: populatedDiscussion,
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

      // Populate the userId field for the newly added reply
      const populatedDiscussion = await Discussion.findById(discussionId)
        .populate("replies.userId", "userName profileImage")
        .exec();

      if (!populatedDiscussion) {
        throw new Error("Failed to populate discussion");
      }

      // The newly added reply should be the last one in the replies array
      const newReply = populatedDiscussion.replies[populatedDiscussion.replies.length - 1];

      sendResponse(res, {
        success: true,
        status: StatusCode.CREATED,
        message: "Reply added successfully",
        data: newReply,
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

      if (!problemId) {
        throw new BadRequestError(ErrorMessages.PROBLEM_ID_REQUIRED);
      }

      const { discussions, total } =
        await this.discussionService.getDiscussionsByProblemId(
          problemId,
          page,
          limit
        );

      console.log("33333333", discussions);

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
import { FilterQuery } from "mongoose";
import { IDiscussionRepository } from "../interfaces/repositoryInterfaces/IDiscussionRepository";
import { IProblemRepository } from "../interfaces/repositoryInterfaces/IProblemRepository";
import { IDiscussionService } from "../interfaces/serviceInterfaces/IDiscussionService";
import { IDiscussion } from "../types/IDiscussion";
import { BadRequestError, ErrorMessages, NotFoundError } from "../utils/errors";

class DiscussionService implements IDiscussionService {
  constructor(
    private discussionRepository: IDiscussionRepository,
    private problemRepository: IProblemRepository
  ) {}

  async createDiscussion(
    problemId: string,
    userId: string,
    message: string
  ): Promise<IDiscussion> {
    if (!problemId || !userId || !message?.trim()) {
      throw new BadRequestError(ErrorMessages.ALL_FIELDS_REQUIRED);
    }

    const problem = await this.problemRepository.findById(problemId);
    if (!problem) {
      throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    }

    const discussionData: Partial<IDiscussion> = {
      problemId,
      userId,
      message: message.trim(),
    };

    return this.discussionRepository.create(discussionData);
  }

  async addReply(
    discussionId: string,
    userId: string,
    message: string
  ): Promise<IDiscussion> {
    if (!discussionId || !userId || !message?.trim()) {
      throw new BadRequestError(ErrorMessages.ALL_FIELDS_REQUIRED);
    }

    const discussion = await this.discussionRepository.findById(discussionId);
    if (!discussion) {
      throw new NotFoundError(ErrorMessages.DISCUSSION_NOT_FOUND);
    }

    const reply = {
      userId,
      message: message.trim(),
      createdAt: new Date(),
    };

    discussion.replies.push(reply);
    return discussion.save();
  }

  async getDiscussionsByProblemId(
    problemId: string,
    page: number,
    limit: number
  ): Promise<{ discussions: IDiscussion[]; total: number }> {
    if (!problemId) {
      throw new BadRequestError(ErrorMessages.PROBLEM_ID_REQUIRED);
    }

    const problem = await this.problemRepository.findById(problemId);
    console.log("222222",problem);
    
    if (!problem) {
      throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);
    }

    const query: FilterQuery<IDiscussion> = { problemId };
    return this.discussionRepository.findPaginated(page, limit, query);
  }
}

export default DiscussionService;
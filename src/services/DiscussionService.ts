import { FilterQuery } from "mongoose";
import { IDiscussionRepository } from "../interfaces/repositoryInterfaces/IDiscussionRepository";
import { IProblemRepository } from "../interfaces/repositoryInterfaces/IProblemRepository";
import { IDiscussionService } from "../interfaces/serviceInterfaces/IDiscussionService";
import { IDiscussion } from "../types/IDiscussion";
import { BadRequestError, ErrorMessages, NotFoundError } from "../utils/errors";

class DiscussionService implements IDiscussionService {
  constructor(
    private _discussionRepository: IDiscussionRepository,
    private _problemRepository: IProblemRepository
  ) {}

  async createDiscussion(problemId: string, userId: string, message: string): Promise<IDiscussion> {
    if (!problemId || !userId || !message?.trim()) {
      throw new BadRequestError(ErrorMessages.ALL_FIELDS_REQUIRED);
    }

    const problem = await this._problemRepository.findById(problemId);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);

    return this._discussionRepository.createAndPopulate({ problemId, userId, message: message.trim() });
  }

  async addReply(discussionId: string, userId: string, message: string): Promise<IDiscussion> {
    if (!discussionId || !userId || !message?.trim()) {
      throw new BadRequestError(ErrorMessages.ALL_FIELDS_REQUIRED);
    }

    return this._discussionRepository.addReplyAndPopulate(discussionId, userId, message.trim());
  }

  async getDiscussionsByProblemId(problemId: string, page: number, limit: number): Promise<{ discussions: IDiscussion[]; total: number }> {
    if (!problemId) throw new BadRequestError(ErrorMessages.PROBLEM_ID_REQUIRED);

    const problem = await this._problemRepository.findById(problemId);
    if (!problem) throw new NotFoundError(ErrorMessages.PROBLEM_NOT_FOUND);

    const query: FilterQuery<IDiscussion> = { problemId };
    return this._discussionRepository.findPaginated(page, limit, query);
  }

  async upvoteDiscussion(discussionId: string, userId: string): Promise<IDiscussion> {
    return this._discussionRepository.upvoteDiscussion(discussionId, userId);
  }

  async upvoteReply(discussionId: string, replyIndex: number, userId: string): Promise<IDiscussion> {
    return this._discussionRepository.upvoteReply(discussionId, replyIndex, userId);
  }
}

export default DiscussionService;
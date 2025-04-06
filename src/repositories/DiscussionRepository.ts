import { FilterQuery } from "mongoose";
import { IDiscussion } from "../types/IDiscussion";
import Discussion from "../models/DiscussionModel";
import BaseRepository from "./BaseRepository";
import { IDiscussionRepository } from "../interfaces/repositoryInterfaces/IDiscussionRepository";

class DiscussionRepository extends BaseRepository<IDiscussion> implements IDiscussionRepository {
  constructor() {
    super(Discussion);
  }

  async createAndPopulate(
    data: Partial<IDiscussion>
  ): Promise<IDiscussion> {
    const created = await this.model.create(data);
    return this.model
      .findById(created._id)
      .populate("userId", "userName profileImage")
      .lean()
      .exec() as Promise<IDiscussion>;
  }
  
  async addReplyAndPopulate(
    discussionId: string,
    userId: string,
    message: string
  ): Promise<IDiscussion> {
    const discussion = await this.model.findById(discussionId);
    if (!discussion) {
      throw new Error("Discussion not found");
    }

    discussion.replies.push({ userId, message, createdAt: new Date() });
    await discussion.save();

    return this.model
      .findById(discussionId)
      .populate("replies.userId", "userName profileImage")
      .lean()
      .exec() as Promise<IDiscussion>;
  }

  async findPaginated(
    page: number,
    limit: number,
    query: FilterQuery<IDiscussion>
  ): Promise<{ discussions: IDiscussion[]; total: number }> {
    const skip = (page - 1) * limit;

    const [discussions, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "userName profileImage")
        .populate("replies.userId", "userName profileImage")
        .lean()
        .exec(),

      this.model.countDocuments(query),
    ]);

    return { discussions, total };
  }
}

export default DiscussionRepository;

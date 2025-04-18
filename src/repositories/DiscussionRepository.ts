import { FilterQuery, Types } from "mongoose";
import { IDiscussion } from "../types/IDiscussion";
import Discussion from "../models/DiscussionModel";
import BaseRepository from "./BaseRepository";
import { IDiscussionRepository } from "../interfaces/repositoryInterfaces/IDiscussionRepository";

class DiscussionRepository extends BaseRepository<IDiscussion> implements IDiscussionRepository {
  constructor() {
    super(Discussion);
  }

  async createAndPopulate(data: Partial<IDiscussion>): Promise<IDiscussion> {
    const created = await this.model.create(data);
    return this.model
      .findById(created._id)
      .populate("userId", "userName profileImage")
      .populate("replies.userId", "userName profileImage")
      .lean()
      .exec() as Promise<IDiscussion>;
  }

  async addReplyAndPopulate(discussionId: string, userId: Types.ObjectId | string, message: string): Promise<IDiscussion> {
    const discussion = await this.model.findById(discussionId);
    if (!discussion) throw new Error("Discussion not found");

    discussion.replies.push({
      userId: userId,
      message: message,
      createdAt: new Date(),
      upvotes: 0,
      downvotes: 0,
      upvotedBy: [],
      score: 0,
    });
    await discussion.save();

    return this.model
      .findById(discussionId)
      .populate("replies.userId", "userName profileImage")
      .lean()
      .exec() as Promise<IDiscussion>;
  }

  async findPaginated(page: number, limit: number, query: FilterQuery<IDiscussion>): Promise<{ discussions: IDiscussion[]; total: number }> {
    const skip = (page - 1) * limit;
    const now = new Date();

    const [discussions, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "userName profileImage")
        .populate("replies.userId", "userName profileImage")
        .lean()
        .exec(),
      this.model.countDocuments(query),
    ]);

    discussions.forEach(d => {
      d.score = this.calculateScore(d.upvotes, d.downvotes, d.createdAt, now);
      d.replies.forEach(r => {
        r.score = this.calculateScore(r.upvotes, r.downvotes, r.createdAt, now);
      });
    });

    return { discussions, total };
  }

  async upvoteDiscussion(discussionId: string, userId: Types.ObjectId | string): Promise<IDiscussion> {
    const discussion = await this.model.findById(discussionId);
    if (!discussion) throw new Error("Discussion not found");
    if (!discussion.upvotedBy.includes(userId as Types.ObjectId)) {
      discussion.upvotes += 1;
      discussion.upvotedBy.push(userId as Types.ObjectId);
      discussion.score = this.calculateScore(discussion.upvotes, discussion.downvotes, discussion.createdAt, new Date());
      await discussion.save();
    }
    return this.model
      .findById(discussionId)
      .populate("userId", "userName profileImage")
      .populate("replies.userId", "userName profileImage")
      .lean()
      .exec() as Promise<IDiscussion>;
  }

  async upvoteReply(discussionId: string, replyIndex: number, userId: Types.ObjectId | string): Promise<IDiscussion> {
    const discussion = await this.model.findById(discussionId);
    if (!discussion || !discussion.replies[replyIndex]) throw new Error("Reply not found");
    const reply = discussion.replies[replyIndex];
    if (!reply.upvotedBy.includes(userId as Types.ObjectId)) {
      reply.upvotes += 1;
      reply.upvotedBy.push(userId as Types.ObjectId);
      reply.score = this.calculateScore(reply.upvotes, reply.downvotes, reply.createdAt, new Date());
      await discussion.save();
    }
    return this.model
      .findById(discussionId)
      .populate("replies.userId", "userName profileImage")
      .lean()
      .exec() as Promise<IDiscussion>;
  }

  private calculateScore(upvotes: number, downvotes: number, createdAt: Date, now: Date): number {
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 3600);
    const decayFactor = 0.1;
    return upvotes / (upvotes + downvotes + 1) + Math.log(Math.max(1, hoursDiff)) * decayFactor;
  }
}

export default DiscussionRepository;
import { FilterQuery } from "mongoose";
import { IDiscussion } from "../types/IDiscussion";
import Discussion from "../models/DiscussionModel";
import BaseRepository from "./BaseRepository";
import { IDiscussionRepository } from "../interfaces/repositoryInterfaces/IDiscussionRepository";

class discussionRepository extends BaseRepository<IDiscussion> implements IDiscussionRepository
{
  constructor() {
    super(Discussion);
  }

  async findPaginated(
    page: number,
    limit: number,
    query: FilterQuery<IDiscussion> = {}
  ): Promise<{ discussions: IDiscussion[]; total: number }> {
    const skip = (page - 1) * limit;
    const [discussions, total] = await Promise.all([
      this.model
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate("userId", "userName fullName")
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { discussions, total };
  }
}

export default discussionRepository;
// Backend\src\repositories\ContestRepository.ts
import { FilterQuery } from "mongoose";
import BaseRepository from "./BaseRepository";
import Contest from "../models/ContestModel";
import { IContestRepository } from "../interfaces/repositoryInterfaces/IContestRepository";

class ContestRepository extends BaseRepository<any> implements IContestRepository {
  constructor() {
    super(Contest);
  }

  async findPaginated(page: number, limit: number, query: FilterQuery<any> = {}): Promise<{ contests: any[]; total: number }> {
    const skip = (page - 1) * limit;
    const [contests, total] = await Promise.all([
      this.model
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate("problems", "_id title difficulty slug")
        .populate("participants", "_id userName")
        .lean()
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);
    return { contests, total };
  }

  async addParticipant(contestId: string, userId: string): Promise<any> {
    return this.model
      .findByIdAndUpdate(
        contestId,
        { $addToSet: { participants: userId } },
        { new: true }
      )
      .populate("problems", "_id title difficulty slug")
      .populate("participants", "_id userName")
      .lean()
      .exec();
  }

  async countDocuments(query: FilterQuery<any> = {}): Promise<number> {
    return this.model.countDocuments(query).exec();
  }

  async findByIdAndUpdate(contestId: string, update: Partial<any>, options: { new: boolean } = { new: true }): Promise<any> {
    return this.model
      .findByIdAndUpdate(contestId, update, options)
      .populate("problems", "_id title difficulty slug")
      .populate("participants", "_id userName")
      .lean()
      .exec();
  }

  async findById(contestId: string): Promise<any> {
    return this.model
      .findById(contestId)
      .populate("problems", "_id title difficulty slug")
      .populate("participants", "_id userName")
      .lean()
      .exec();
  }

  async create(data: any): Promise<any> {
    return this.model.create(data);
  }
}

export default ContestRepository;
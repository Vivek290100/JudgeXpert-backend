// Backend\src\repositories\ContestRepository.ts
import { FilterQuery, Types } from "mongoose";
import BaseRepository from "./BaseRepository";
import Contest from "../models/ContestModel";
import { IContestRepository } from "../interfaces/repositoryInterfaces/IContestRepository";
import Submission from "../models/SubmissionModel";

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

  async findTopSubmissions(problemId: string, contestId: string, limit: number = 10): Promise<any[]> {
    return Submission
      .find({ 
        problemId: new Types.ObjectId(problemId),
        contestId: new Types.ObjectId(contestId),
        passed: true
      })
      .sort({ executionTime: 1, submittedAt: 1 })
      .limit(limit)
      .populate('userId', '_id userName')
      .lean()
      .exec();
  }

  async findLatestSubmissions(problemId: string, contestId: string, userIds?: string[]): Promise<any[]> {
    const query: FilterQuery<any> = {
      problemId: new Types.ObjectId(problemId),
      contestId: new Types.ObjectId(contestId),
      passed: true,
    };
    if (userIds) {
      query.userId = { $in: userIds.map(id => new Types.ObjectId(id)) };
    }

    const result = await Submission.aggregate([
      { $match: query },
      { $sort: { submittedAt: -1 } },
      {
        $group: {
          _id: "$userId",
          latestSubmission: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "latestSubmission.userId",
          foreignField: "_id",
          as: "userId",
        },
      },
      { $unwind: "$userId" },
      {
        $project: {
          "userId._id": 1,
          "userId.userName": 1,
          "latestSubmission.executionTime": 1,
          "latestSubmission.submittedAt": 1,
        },
      },
    ]).exec();

    return result;
  }

  async findByStartTimeRange(start: Date, end: Date): Promise<any[]> {
    return this.model
      .find({ startTime: { $gte: start, $lte: end } })
      .populate("problems", "_id title difficulty slug")
      .populate("participants", "_id userName")
      .lean()
      .exec();
  }
}

export default ContestRepository;
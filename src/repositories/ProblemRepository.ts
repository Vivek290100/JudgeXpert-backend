import { FilterQuery, UpdateQuery } from "mongoose";
import { IProblem } from "../types/IProblem";
import Problem from "../models/ProblemModel";
import BaseRepository from "./BaseRepository";
import { IProblemRepository } from "../interfaces/repositoryInterfaces/IProblemRepository";

class ProblemRepository extends BaseRepository<IProblem> implements IProblemRepository {
  constructor() {
    super(Problem);
  }

  async findBySlug(slug: string): Promise<IProblem | null> {
    return this.model
      .findOne({ slug })
      .populate("testCaseIds")
      .populate("defaultCodeIds")
      .lean()
      .exec();
  }

  async findPaginated(
    page: number,
    limit: number,
    query: FilterQuery<IProblem> = {}
  ): Promise<{ problems: IProblem[]; total: number }> {
    const skip = (page - 1) * limit;
    const [problems, total] = await Promise.all([
      this.model
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate("testCaseIds")
        .populate("defaultCodeIds")
        .lean()
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);
    
    return { problems, total };
  }

  async incrementSolvedCount(problemId: string): Promise<IProblem | null> {
    return this.model
      .findByIdAndUpdate(
        problemId,
        { $inc: { solvedCount: 1 } },
        { new: true }
      )
      .populate("testCaseIds")
      .populate("defaultCodeIds")
      .lean()
      .exec();
  }

  async upsertProblem(
    query: FilterQuery<IProblem>,
    update: UpdateQuery<IProblem>,
    options: any = { upsert: true, new: true }
  ): Promise<IProblem | null> {
    return this.model
      .findOneAndUpdate(query, update, options)
      .populate("testCaseIds")
      .populate("defaultCodeIds")
      .lean()
      .exec();
  }

  async findById(id: string): Promise<IProblem | null> {
    return this.model
      .findById(id)
      .populate("testCaseIds")
      .populate("defaultCodeIds")
      .lean()
      .exec();
  }

  async find(query: FilterQuery<IProblem>): Promise<IProblem[]> {
    return this.model
      .find(query)
      .populate("testCaseIds")
      .populate("defaultCodeIds")
      .lean()
      .exec();
  }

  async countDocuments(query: FilterQuery<IProblem>): Promise<number> {
    return this.model.countDocuments(query).exec();
  }
}

export default ProblemRepository;
// Backend\src\services\ContestService.ts
import { IContestRepository } from "../interfaces/repositoryInterfaces/IContestRepository";
import { IContestService } from "../interfaces/serviceInterfaces/IContestService";
import { BadRequestError, ErrorMessages } from "../utils/errors";
import { FilterQuery } from "mongoose";

class ContestService implements IContestService {
  constructor(private contestRepository: IContestRepository) {}

  async createContest(data: any): Promise<any> {
    if (new Date(data.startTime) >= new Date(data.endTime)) {
      throw new BadRequestError("Start time must be before end time");
    }
    return this.contestRepository.create(data);
  }

  async getContests(page: number, limit: number, query: FilterQuery<any> = {}): Promise<{
    contests: any[];
    totalPages: number;
    currentPage: number;
    totalContests: number;
    activeContests: number;
    upcomingContests: number;
    endedContests: number;
  }> {
    const userQuery = { ...query, isBlocked: false };
    const { contests, total } = await this.contestRepository.findPaginated(page, limit, userQuery);
    const now = new Date();

    const [activeCount, upcomingCount, endedCount] = await Promise.all([
      this.contestRepository.countDocuments({ ...userQuery, startTime: { $lte: now }, endTime: { $gte: now } }),
      this.contestRepository.countDocuments({ ...userQuery, startTime: { $gt: now } }),
      this.contestRepository.countDocuments({ ...userQuery, endTime: { $lt: now } }),
    ]);

    return {
      contests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalContests: total,
      activeContests: activeCount,
      upcomingContests: upcomingCount,
      endedContests: endedCount,
    };
  }

  async getContestById(contestId: string): Promise<any> {
    const contest = await this.contestRepository.findById(contestId);
    if (!contest || contest.isBlocked) {
      throw new BadRequestError(ErrorMessages.CONTEST_NOT_FOUND);
    }
    return contest;
  }

  async registerForContest(id: string, userId: string): Promise<{ message: string }> {
    const contest = await this.contestRepository.findById(id);
    if (!contest || contest.isBlocked) throw new BadRequestError(ErrorMessages.CONTEST_NOT_FOUND);
    if (contest.participants.some((p: any) => p._id.toString() === userId)) {
      throw new BadRequestError(ErrorMessages.USER_ALREADY_REGISTERED);
    }
    if (new Date(contest.startTime) < new Date()) {
      throw new BadRequestError(ErrorMessages.CONTEST_ALREADY_STARTED);
    }
    await this.contestRepository.addParticipant(id, userId);
    return { message: "Registered successfully" };
  }

  async updateContestStatus(contestId: string, isBlocked: boolean): Promise<any> {
    const contest = await this.contestRepository.findByIdAndUpdate(
      contestId,
      { isBlocked },
      { new: true }
    );
    if (!contest) throw new BadRequestError(ErrorMessages.CONTEST_NOT_FOUND);
    return contest;
  }

  async getRegisteredContests(userId: string): Promise<string[]> {
    const contests = await this.contestRepository.findPaginated(1, 1000, {
      participants: userId,
      isBlocked: false,
    });
    return contests.contests.map((contest) => contest._id);
  }

  async getProblemResultsForContest(contestId: string, problemId: string): Promise<any[]> {
    // Validate contest and problem exist
    const contest = await this.contestRepository.findById(contestId);
    if (!contest) {
      throw new BadRequestError(ErrorMessages.CONTEST_NOT_FOUND);
    }
    
    const problemExists = contest.problems.some((p: any) => p._id.toString() === problemId);
    if (!problemExists) {
      throw new BadRequestError("Problem not found in this contest");
    }
    
    // Find all successful submissions for this problem in this contest
    // Sort by execution time (fastest first) and submission time (earliest first)
    // This assumes you have a Submission model/collection
    const submissions = await this.contestRepository.findTopSubmissions(
      problemId, 
      contestId,
      10 // Limit to top 10 participants
    );
    
    return submissions.map((submission: any) => ({
      userId: submission.userId._id,
      userName: submission.userId.userName,
      executionTime: submission.executionTime,
      submittedAt: submission.createdAt
    }));
  }

}

export default ContestService;
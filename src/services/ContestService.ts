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

  async registerForContest(id: string, userId: string): Promise<{ message: string }> {
    const contest = await this.contestRepository.findById(id);
    if (!contest || contest.isBlocked) throw new BadRequestError(ErrorMessages.CONTEST_NOT_FOUND);
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
}

export default ContestService;
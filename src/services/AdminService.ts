import { DashboardStats, IAdminService, RevenueStats } from "../interfaces/serviceInterfaces/IAdminService";
import { IUser } from "../types/IUser";
import { IUserRepository } from "../interfaces/repositoryInterfaces/IUserRepository";
import { NotFoundError, InternalServerError, ErrorMessages } from "../utils/errors";
import { IProblemRepository } from "../interfaces/repositoryInterfaces/IProblemRepository";
import { IContestRepository } from "../interfaces/repositoryInterfaces/IContestRepository";
import { ISubscriptionRepository } from "../interfaces/repositoryInterfaces/ISubscriptionRepository";

class AdminService implements IAdminService {
  constructor(
    private _userRepository: IUserRepository,
    private _problemRepository: IProblemRepository,
    private _contestRepository: IContestRepository,
    private _subscriptionRepository: ISubscriptionRepository
  ) {}

  async getAllUsers(page: number = 1, limit: number = 10, search: string = ""): Promise<{ users: IUser[], total: number }> {
    const query = {
      role: { $ne: "admin" },
      ...(search && {
        $or: [
          { userName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }),
    };
    const { users, total } = await this._userRepository.findPaginated(page, limit, query);
    return { users, total };
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    }
    return user;
  }

  async toggleBlockStatus(userId: string, isBlocked: boolean): Promise<IUser> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    const updatedUser = await this._userRepository.update(userId, { isBlocked });
    if (!updatedUser) throw new InternalServerError(`Failed to ${isBlocked ? "block" : "unblock"} user`);
    return updatedUser;
  }

  async blockUser(userId: string): Promise<IUser> {
    return this.toggleBlockStatus(userId, true);
  }

  async unblockUser(userId: string): Promise<IUser> {
    return this.toggleBlockStatus(userId, false);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [totalUsers, subscribers, totalProblems, totalContests] = await Promise.all([
        this._userRepository.countDocuments({ role: { $ne: "admin" } }),
        this._userRepository.countDocuments({ isPremium: true, role: { $ne: "admin" } }),
        this._problemRepository.countDocuments({}),
        this._contestRepository.countDocuments({}),
      ]);
  
      return {
        totalUsers,
        subscribers,
        totalProblems,
        totalContests,
      };
    } catch (error:any) {
      throw new InternalServerError("Failed to fetch dashboard statistics");
    }
  }

  async getRevenueStats(period: 'weekly' | 'monthly' | 'yearly'): Promise<RevenueStats[]> {
    try {
      const groupBy = period === 'yearly' ? { $year: "$createdAt" } :
                      period === 'monthly' ? { $month: "$createdAt" } :
                      { $week: "$createdAt" };
      
      const revenueData = await this._subscriptionRepository.aggregate([
        {
          $match: {
            status: "active",
            createdAt: { $exists: true }
          }
        },
        {
          $group: {
            _id: groupBy,
            revenue: { $sum: "$price" },
            date: { $first: "$createdAt" }
          }
        },
        {
          $sort: { date: 1 }
        },
        {
          $project: {
            period: "$_id",
            revenue: 1,
            date: 1,
            _id: 0
          }
        }
      ]);

      return revenueData.map(data => ({
        period: data.period.toString(),
        revenue: data.revenue,
        date: new Date(data.date)
      }));
    } catch (error:any) {
      throw new InternalServerError("Failed to fetch revenue statistics");
    }
  }
}

export default AdminService;
import { IAdminService } from "../interfaces/serviceInterfaces/IAdminService";
import { IUser } from "../types/IUser";
import { IUserRepository } from "../interfaces/repositoryInterfaces/IUserRepository";
import { NotFoundError, InternalServerError, ErrorMessages } from "../utils/errors";

class AdminService implements IAdminService {
  constructor(private userRepository: IUserRepository) {}

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
    const { users, total } = await this.userRepository.findPaginated(page, limit, query);
    return { users, total };
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    }
    return user;
  }

  async toggleBlockStatus(userId: string, isBlocked: boolean): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    const updatedUser = await this.userRepository.update(userId, { isBlocked });
    if (!updatedUser) throw new InternalServerError(`Failed to ${isBlocked ? "block" : "unblock"} user`);
    return updatedUser;
  }

  async blockUser(userId: string): Promise<IUser> {
    return this.toggleBlockStatus(userId, true);
  }

  async unblockUser(userId: string): Promise<IUser> {
    return this.toggleBlockStatus(userId, false);
  }
}

export default AdminService;
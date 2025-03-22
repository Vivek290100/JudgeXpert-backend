// Backend\src\services\AdminService.ts
import { IAdminService } from "../interfaces/IAdminService";
import { IUser } from "../interfaces/IUser";
import { IUserRepository } from "../interfaces/IUserRepository";
import { NotFoundError } from "../utils/errors";

class AdminService implements IAdminService {
  constructor(private userRepository: IUserRepository) {}

  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: IUser[], total: number }> {
    const { users, total } = await this.userRepository.findPaginated(page, limit, { role: { $ne: "admin" } });
    return { users, total };
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User is not found");
    }
    return user;
  }

async toggleBlockStatus(userId: string, isBlocked: boolean): Promise<IUser> {
  const user = await this.userRepository.findById(userId);
  if (!user) throw new NotFoundError("User is not found");
  const updatedUser = await this.userRepository.update(userId, { isBlocked });
  if (!updatedUser) throw new Error(`Failed to ${isBlocked ? "block" : "unblock"} user`);
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
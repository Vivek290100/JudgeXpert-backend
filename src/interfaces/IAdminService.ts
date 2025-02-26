import { IUser } from "./IUser";

export interface IAdminService {
    getAllUsers(page: number, limit: number): Promise<{ users: IUser[], total: number }>;
    getUserById(userId: string): Promise<IUser>;
    blockUser(userId: string): Promise<IUser>;
    unblockUser(userId: string): Promise<IUser>;
    toggleBlockStatus(userId: string, isBlocked: boolean): Promise<IUser>;
  }
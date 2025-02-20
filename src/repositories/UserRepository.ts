// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\repositories\UserRepository.ts
import { IUser } from "../interfaces/IUser";
import User from "../models/UserModel";
import BaseRepository from "./BaseRepository";

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }
}

export default UserRepository

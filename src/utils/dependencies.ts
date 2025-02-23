
// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\dependencies.ts
import UserRepository from "../repositories/UserRepository";
import RefreshTokenRepository from "../repositories/RefreshTokenRepository";
import UserService from "../services/UserService";
import UserController from "../controllers/UserController";

import AdminService from "../services/AdminService";
import AdminController from "../controllers/AdminController";


// User Dependencies
const  userRepository = new UserRepository()
const  refreshTokenRepository = new RefreshTokenRepository()

const  userService = new UserService(userRepository, refreshTokenRepository)
const  userController = new UserController(userService)


// Admin Dependencies
const  adminService = new AdminService( userRepository);
const  adminController = new AdminController(adminService);


export const Dependencies = {
    userRepository,
    refreshTokenRepository,
    userService,
    userController,
    adminService,
    adminController,
}


export default Dependencies
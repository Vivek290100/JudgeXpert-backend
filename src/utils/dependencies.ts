// // C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\dependencies.ts
// import UserRepository from "../repositories/UserRepository";
// import RefreshTokenRepository from "../repositories/RefreshTokenRepository";
// import UserService from "../services/UserService";
// import UserController from "../controllers/UserController";

// import AdminService from "../services/AdminService";
// import AdminController from "../controllers/AdminController";
// import { IUserService } from "../interfaces/IUserService";
// import { IAdminService } from "../interfaces/IAdminService";


// // User Dependencies
// const  userRepository = new UserRepository()
// const  refreshTokenRepository = new RefreshTokenRepository()

// const  userService: IUserService = new UserService(userRepository, refreshTokenRepository)
// const  userController = new UserController(userService)


// // Admin Dependencies
// const  adminService: IAdminService = new AdminService( userRepository);
// const  adminController = new AdminController(adminService);


// export const Dependencies = {
//     userRepository,
//     refreshTokenRepository,
//     userService,
//     userController,
//     adminService,
//     adminController,
// }


// export default Dependencies


// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\dependencies.ts
import UserRepository from "../repositories/UserRepository";
import RefreshTokenRepository from "../repositories/RefreshTokenRepository";
import UserService from "../services/UserService";
import UserController from "../controllers/UserController";

import AdminService from "../services/AdminService";
import AdminController from "../controllers/AdminController";
import { IUserService } from "../interfaces/IUserService";
import { IAdminService } from "../interfaces/IAdminService";

// New imports for problems, submissions, contests, and leaderboards
import ProblemRepository from "../repositories/ProblemRepository";
import ProblemService from "../services/ProblemService";
import ProblemController from "../controllers/ProblemController";
import { IProblemService } from "../interfaces/IProblemService";

// User Dependencies
const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();

const userService: IUserService = new UserService(userRepository, refreshTokenRepository);
const userController = new UserController(userService);

// Admin Dependencies
const adminService: IAdminService = new AdminService(userRepository);
const adminController = new AdminController(adminService);

// Problem Dependencies
const problemRepository = new ProblemRepository();
const problemService: IProblemService = new ProblemService(problemRepository);
const problemController = new ProblemController(problemService);

export const Dependencies = {
    // Existing dependencies
    userRepository,
    refreshTokenRepository,
    userService,
    userController,
    adminService,
    adminController,

    // New dependencies for problems, submissions, contests, and leaderboards
    problemRepository,
    problemService,
    problemController,

};

export default Dependencies;
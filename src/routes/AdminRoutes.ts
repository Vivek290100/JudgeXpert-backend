// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\routes\AdminRoutes.ts
import { Router } from "express";
import { AdminRoutes } from "../constants/routes";
import { Dependencies } from "../utils/dependencies";
import adminMiddleware from "../middlewares/adminMiddleware";


const adminRouter = Router();
const adminController = Dependencies.adminController;
const problemController = Dependencies.problemController;


adminRouter.get(AdminRoutes.GET_ALL_USERS, adminMiddleware, adminController.getAllUsers.bind(adminController));
adminRouter.get(AdminRoutes.GET_USER_BY_ID, adminMiddleware, adminController.getUserById.bind(adminController));
adminRouter.post(AdminRoutes.BLOCK_USER, adminMiddleware, adminController.blockUser.bind(adminController));
adminRouter.post(AdminRoutes.UNBLOCK_USER, adminMiddleware, adminController.unblockUser.bind(adminController));
adminRouter.post(AdminRoutes.TOGGLE_BLOCK, adminMiddleware, adminController.toggleBlockUser.bind(adminController));

// Problem Management Routes
adminRouter.get(AdminRoutes.GET_ALL_PROBLEMS, adminMiddleware, problemController.getProblems.bind(problemController));
adminRouter.post(AdminRoutes.CREATE_PROBLEM, adminMiddleware, problemController.createProblem.bind(problemController));
adminRouter.get(AdminRoutes.GET_PROBLEM_BY_ID, adminMiddleware, problemController.getProblemById.bind(problemController));
adminRouter.patch(AdminRoutes.UPDATE_PROBLEM, adminMiddleware, problemController.updateProblem.bind(problemController));
adminRouter.patch(AdminRoutes.UPDATE_PROBLEM_STATUS, adminMiddleware, problemController.updateProblemStatus.bind(problemController));
adminRouter.post(AdminRoutes.PROCESS_SPECIFIC_PROBLEM, adminMiddleware, problemController.processSpecificProblem.bind(problemController));


export default adminRouter;
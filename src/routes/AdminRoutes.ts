// Backend\src\routes\AdminRoutes.ts
import { Router } from "express";
import { AdminRoutes } from "../utils/constants";
import { Dependencies } from "../utils/dependencies";
import adminMiddleware from "../middlewares/adminMiddleware";


const adminRouter = Router();
const { adminController, problemController } = Dependencies;

// User 
adminRouter
  .get(AdminRoutes.GET_ALL_USERS, adminMiddleware, adminController.getAllUsers.bind(adminController))
  .get(AdminRoutes.GET_USER_BY_ID, adminMiddleware, adminController.getUserById.bind(adminController))
  .post(AdminRoutes.BLOCK_USER, adminMiddleware, adminController.blockUser.bind(adminController))
  .post(AdminRoutes.UNBLOCK_USER, adminMiddleware, adminController.unblockUser.bind(adminController))
  .post(AdminRoutes.TOGGLE_BLOCK, adminMiddleware, adminController.toggleBlockUser.bind(adminController));

// Problem 
adminRouter
  .get(AdminRoutes.GET_ALL_PROBLEMS, adminMiddleware, problemController.getProblems.bind(problemController))
  .post(AdminRoutes.CREATE_PROBLEM, adminMiddleware, problemController.createProblem.bind(problemController))
  .get(AdminRoutes.GET_PROBLEM_BY_ID, adminMiddleware, problemController.getProblemById.bind(problemController))
  .patch(AdminRoutes.UPDATE_PROBLEM, adminMiddleware, problemController.updateProblem.bind(problemController))
  .patch(AdminRoutes.UPDATE_PROBLEM_STATUS, adminMiddleware, problemController.updateProblemStatus.bind(problemController))
  .post(AdminRoutes.PROCESS_SPECIFIC_PROBLEM, adminMiddleware, problemController.processSpecificProblem.bind(problemController))
  .patch(AdminRoutes.BLOCK_PROBLEM, adminMiddleware, problemController.blockProblem.bind(problemController))
  .patch(AdminRoutes.UNBLOCK_PROBLEM, adminMiddleware, problemController.unblockProblem.bind(problemController));



export default adminRouter;
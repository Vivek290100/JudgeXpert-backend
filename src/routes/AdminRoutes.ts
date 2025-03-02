// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\routes\AdminRoutes.ts
import { Router } from "express";
// import authMiddleware from "../middlewares/authMiddleware";
import { AdminRoutes } from "../constants/routes";
import { Dependencies } from "../utils/dependencies";
import adminMiddleware from "../middlewares/adminMiddleware";
import ProblemController from "../controllers/ProblemController";

const adminRouter = Router();
const adminController = Dependencies.adminController;
const problemController = Dependencies.problemController;


adminRouter.get(AdminRoutes.GET_ALL_USERS, adminMiddleware, adminController.getAllUsers.bind(adminController));
adminRouter.get(AdminRoutes.GET_USER_BY_ID, adminMiddleware, adminController.getUserById.bind(adminController));
adminRouter.post(AdminRoutes.BLOCK_USER, adminMiddleware, adminController.blockUser.bind(adminController));
adminRouter.post(AdminRoutes.UNBLOCK_USER, adminMiddleware, adminController.unblockUser.bind(adminController));
adminRouter.post(AdminRoutes.TOGGLE_BLOCK, adminMiddleware, adminController.toggleBlockUser.bind(adminController));

// Problem Management Routes
adminRouter.get("/problems", adminMiddleware, problemController.getProblems.bind(ProblemController));
adminRouter.get("/problems/:id", adminMiddleware, problemController.getProblemById.bind(problemController));
adminRouter.post("/problems", adminMiddleware, problemController.createProblem.bind(problemController));
adminRouter.patch("/problems/:id/status", adminMiddleware, problemController.updateProblemStatus.bind(problemController));
adminRouter.post("/problems/single", adminMiddleware, problemController.processSpecificProblem.bind(problemController));


export default adminRouter;
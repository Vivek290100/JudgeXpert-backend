// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\routes\AdminRoutes.ts
import { Router } from "express";
// import authMiddleware from "../middlewares/authMiddleware";
import { AdminRoutes } from "../constants/routes";
import { Dependencies } from "../utils/dependencies";
import adminMiddleware from "../middlewares/adminMiddleware";

const adminRouter = Router();
const adminController = Dependencies.adminController;

adminRouter.get(AdminRoutes.GET_ALL_USERS, adminMiddleware, adminController.getAllUsers.bind(adminController));
adminRouter.get(AdminRoutes.GET_USER_BY_ID, adminMiddleware, adminController.getUserById.bind(adminController));
adminRouter.post(AdminRoutes.BLOCK_USER, adminMiddleware, adminController.blockUser.bind(adminController));
adminRouter.post(AdminRoutes.UNBLOCK_USER, adminMiddleware, adminController.unblockUser.bind(adminController));
adminRouter.post(AdminRoutes.TOGGLE_BLOCK, adminMiddleware, adminController.toggleBlockUser.bind(adminController));

export default adminRouter;
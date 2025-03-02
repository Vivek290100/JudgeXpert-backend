// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\routes\UserRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { UserRoutes } from "../constants/routes";
import {Dependencies} from "../utils/dependencies"
import { upload } from "../utils/multer";

const userRouter = Router();
const userController = Dependencies.userController;
const problemController = Dependencies.problemController; // Add this

// Routes
userRouter.post(UserRoutes.SIGNUP, userController.signUpUser.bind(userController));
userRouter.post(UserRoutes.OTP_VERIFY, userController.verifyOtp.bind(userController));
userRouter.post(UserRoutes.RESEND_OTP, userController.resendOtp.bind(userController));
userRouter.post(UserRoutes.LOGIN, userController.loginUser.bind(userController));
userRouter.post(UserRoutes.LOGOUT, authMiddleware, userController.logout.bind(userController));
userRouter.post(UserRoutes.FORGOT_PASSWORD, userController.forgotPassword.bind(userController));
userRouter.post(UserRoutes.RESET_PASSWORD, userController.resetPassword.bind(userController));
userRouter.post(UserRoutes.VERIFY_FORGOT_PASSWORD_OTP, userController.verifyForgotPasswordOtp.bind(userController));

userRouter.put(UserRoutes.UPDATE_PROFILE,authMiddleware, upload.single("profileImage"), userController.updateProfile.bind(userController));

// User Problem Routes
userRouter.get("/problems", authMiddleware, problemController.getProblems.bind(problemController));
userRouter.get("/problems/:id", authMiddleware, problemController.getProblemById.bind(problemController));
userRouter.get("/problems/slug/:slug", authMiddleware, problemController.getProblemBySlug.bind(problemController));

// Error handling middleware
userRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
});

export default userRouter;
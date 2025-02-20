// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\routes\UserRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import UserController from "../controllers/UserController";
import UserService from "../services/UserService";
import UserRepository from "../repositories/UserRepository";
import RefreshTokenRepository from "../repositories/RefreshTokenRepository";
import authMiddleware from "../middlewares/authMiddleware";
import { UserRoutes } from "../constants/routes";

const userRouter = Router();
const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const userService = new UserService(userRepository, refreshTokenRepository);
const userController = new UserController(userService);

// Routes
userRouter.post(UserRoutes.SIGNUP, userController.signUpUser.bind(userController));
userRouter.post(UserRoutes.OTP_VERIFY, userController.verifyOtp.bind(userController));
userRouter.post(UserRoutes.RESEND_OTP, userController.resendOtp.bind(userController));
userRouter.post(UserRoutes.LOGIN, userController.loginUser.bind(userController));
userRouter.post(UserRoutes.LOGOUT, authMiddleware, userController.logout.bind(userController));
userRouter.post(UserRoutes.FORGOT_PASSWORD, userController.forgotPassword.bind(userController));
// userRouter.post(UserRoutes.FORGOT_PASSWORD, userController.forgotPassword.bind(userController));
userRouter.post(UserRoutes.RESET_PASSWORD, userController.resetPassword.bind(userController));
userRouter.post(UserRoutes.VERIFY_FORGOT_PASSWORD_OTP, userController.verifyForgotPasswordOtp.bind(userController));


// Error handling middleware
userRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
});

export default userRouter;
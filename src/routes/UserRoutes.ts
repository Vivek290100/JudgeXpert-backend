// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\routes\UserRoutes.ts
import { Router } from "express";
import UserController from "../controllers/UserController";
import UserService from "../services/UserService";
import UserRepository from "../repositories/UserRepository";
import RefreshTokenRepository from "../repositories/RefreshTokenRepository";
import authMiddleware from "../middlewares/authMiddleware"; 


const userRouter = Router();
const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository(); // Add this
const userService = new UserService(userRepository,refreshTokenRepository);
const userController = new UserController(userService);

userRouter.post("/signup", userController.signUpUser.bind(userController));
userRouter.post("/verify-otp", userController.verifyOtp.bind(userController));
userRouter.post("/resend-otp", userController.resendOtp.bind(userController));
userRouter.post("/login", userController.loginUser.bind(userController));
userRouter.post("/logout", authMiddleware, userController.logout.bind(userController));


export default userRouter;

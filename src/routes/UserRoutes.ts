// Backend\src\routes\UserRoutes.ts
import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { ProblemRoutes, UserRoutes } from "../constants/routes";
import {Dependencies} from "../utils/dependencies"
import { upload } from "../utils/multer";

const userRouter = Router();
const { userController, problemController } = Dependencies;


// Auth & user
userRouter
  .post(UserRoutes.SIGNUP, userController.signUpUser.bind(userController))
  .post(UserRoutes.OTP_VERIFY, userController.verifyOtp.bind(userController))
  .post(UserRoutes.RESEND_OTP, userController.resendOtp.bind(userController))
  .post(UserRoutes.LOGIN, userController.loginUser.bind(userController))
  .post(UserRoutes.LOGOUT, authMiddleware, userController.logout.bind(userController))
  .post(UserRoutes.FORGOT_PASSWORD, userController.forgotPassword.bind(userController))
  .post(UserRoutes.RESET_PASSWORD, userController.resetPassword.bind(userController))
  .post(UserRoutes.VERIFY_FORGOT_PASSWORD_OTP, userController.verifyForgotPasswordOtp.bind(userController))
  .put(UserRoutes.UPDATE_PROFILE, authMiddleware, upload.single("profileImage"), userController.updateProfile.bind(userController))
  .post(UserRoutes.GOOGLE_LOGIN, userController.googleLogin.bind(userController))
  .post(UserRoutes.REFRESH_TOKEN, userController.refreshToken.bind(userController));

// Problem
userRouter
  .get(ProblemRoutes.GET_ALL_PROBLEMS, authMiddleware, problemController.getProblems.bind(problemController))
  .get(ProblemRoutes.GET_PROBLEM_BY_SLUG, authMiddleware, problemController.getProblemBySlug.bind(problemController))
  .post(ProblemRoutes.EXECUTE_CODE, authMiddleware,problemController.executeCode.bind(problemController))
  .get(ProblemRoutes.GET_SUBMISSIONS, authMiddleware,problemController.getUserSubmissions.bind(problemController))
export default userRouter;
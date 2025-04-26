import express, { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { ProblemRoutes, UserRoutes } from "../utils/constants";
import { Dependencies } from "../utils/dependencies";
import { upload } from "../utils/multer";

const userRouter = Router();
const { userController, problemController, discussionController, contestController, subscriptionController } = Dependencies;

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
  .post(UserRoutes.REFRESH_TOKEN, userController.refreshToken.bind(userController))
  .get(UserRoutes.LEADERBOARD, authMiddleware, userController.getLeaderboard.bind(userController))
  .post(UserRoutes.CREATE_DISCUSSION, authMiddleware, discussionController.createDiscussion.bind(discussionController))
  .get(UserRoutes.GET_DISCUSSIONS, authMiddleware, discussionController.getDiscussions.bind(discussionController))
  .post(UserRoutes.ADD_REPLY, authMiddleware, discussionController.addReply.bind(discussionController))
  .post(`/discussions/:discussionId/upvote`, authMiddleware, discussionController.upvoteDiscussion.bind(discussionController))
  .post(`/discussions/:discussionId/replies/:replyIndex/upvote`, authMiddleware, discussionController.upvoteReply.bind(discussionController))
  .get("/contests", authMiddleware, contestController.getContests.bind(contestController))
  .get("/contests/:contestId", authMiddleware, contestController.getContestById.bind(contestController))
  .post("/contests/:contestId/register", authMiddleware, contestController.registerForContest.bind(contestController))
  .get("/registered-contests",authMiddleware,contestController.getRegisteredContests.bind(contestController))
  .get("/contests/:contestId/problems/:problemId/results", authMiddleware,contestController.getProblemResults.bind(contestController))
  .post("/subscriptions/checkout", authMiddleware, subscriptionController.createCheckoutSession.bind(subscriptionController))
  .post("/subscriptions/webhook", express.raw({ type: "application/json" }), subscriptionController.handleWebhook.bind(subscriptionController))
  .get(
    "/subscriptions/current",
    authMiddleware,
    subscriptionController.getCurrentSubscription.bind(subscriptionController)
  )
  .get("/subscriptions/success", authMiddleware, subscriptionController.handleSuccess.bind(subscriptionController))
  .get("/subscriptions/session", authMiddleware, subscriptionController.getCheckoutSession.bind(subscriptionController));

userRouter
  .get(ProblemRoutes.GET_ALL_PROBLEMS, authMiddleware, problemController.getProblems.bind(problemController))
  .get(ProblemRoutes.GET_PROBLEM_BY_SLUG, authMiddleware, problemController.getProblemBySlug.bind(problemController))
  .post(ProblemRoutes.EXECUTE_CODE, authMiddleware, problemController.executeCode.bind(problemController))
  .get(ProblemRoutes.GET_SUBMISSIONS, authMiddleware, problemController.getUserSubmissions.bind(problemController))
export default userRouter;
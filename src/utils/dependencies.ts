import { Server } from "socket.io";
import UserRepository from "../repositories/UserRepository";
import RefreshTokenRepository from "../repositories/RefreshTokenRepository";
import { IUserRepository } from "../interfaces/repositoryInterfaces/IUserRepository";
import { IRefreshTokenRepository } from "../interfaces/repositoryInterfaces/IRefreshTokenRepository";
import UserService from "../services/UserService";
import UserController from "../controllers/UserController";
import AdminService from "../services/AdminService";
import AdminController from "../controllers/AdminController";
import { IUserService } from "../interfaces/serviceInterfaces/IUserService";
import { IAdminService } from "../interfaces/serviceInterfaces/IAdminService";
import ProblemRepository from "../repositories/ProblemRepository";
import ProblemService from "../services/ProblemService";
import ProblemController from "../controllers/ProblemController";
import { IProblemService } from "../interfaces/serviceInterfaces/IProblemService";
import { IProblemRepository } from "../interfaces/repositoryInterfaces/IProblemRepository";
import { CONFIG } from "../config/config";
import { IJWTService } from "../interfaces/utilInterfaces/IJWTService";
import JWTService from "./jwt";
import BrevoEmailService from "./emailBrevo";
import { IEmailService } from "../interfaces/utilInterfaces/IEmailService";
import { IRedisService } from "../interfaces/utilInterfaces/IRedisService";
import RedisService from "./redis";
import { IDiscussionRepository } from "../interfaces/repositoryInterfaces/IDiscussionRepository";
import DiscussionRepository from "../repositories/DiscussionRepository";
import DiscussionService from "../services/DiscussionService";
import { IDiscussionService } from "../interfaces/serviceInterfaces/IDiscussionService";
import DiscussionController from "../controllers/DiscussionController";
import { IContestRepository } from "../interfaces/repositoryInterfaces/IContestRepository";
import { IContestService } from "../interfaces/serviceInterfaces/IContestService";
import ContestRepository from "../repositories/ContestRepository";
import ContestService from "../services/ContestService";
import ContestController from "../controllers/ContestController";
import { INotificationService } from "../interfaces/serviceInterfaces/INotificationService";
import NotificationService from "../services/NotificationService";
import { ISubscriptionService } from "../interfaces/serviceInterfaces/ISubscriptionService";
import SubscriptionService from "../services/SubscriptionService";
import SubscriptionController from "../controllers/SubscriptionController";
import { ISubscriptionRepository } from "../interfaces/repositoryInterfaces/ISubscriptionRepository";
import SubscriptionRepository from "../repositories/SubscriptionRepository";
import { ProblemFolderService } from "../services/ProblemFolderService";

interface DependenciesType {
  userRepository: IUserRepository;
  refreshTokenRepository: IRefreshTokenRepository;
  jwtService: IJWTService;
  emailService: IEmailService;
  redisService: RedisService;
  userService: IUserService;
  userController: UserController;
  adminService: IAdminService;
  adminController: AdminController;
  problemRepository: IProblemRepository;
  problemService: IProblemService;
  problemController: ProblemController;
  discussionRepository: IDiscussionRepository;
  discussionService: IDiscussionService;
  discussionController: DiscussionController;
  contestRepository: IContestRepository;
  contestService: IContestService;
  contestController: ContestController;
  subscriptionRepository: ISubscriptionRepository;
  subscriptionService: ISubscriptionService;
  subscriptionController: SubscriptionController;
  notificationService?: INotificationService;
  problemFolderService?: ProblemFolderService;
  io?: Server;
}

const initializeDependencies = (io?: Server): DependenciesType => {
  const userRepository: IUserRepository = new UserRepository();
  const redisService: RedisService = new RedisService(
    CONFIG.REDIS_USERNAME,
    CONFIG.REDIS_PASSWORD,
    CONFIG.REDIS_HOST,
    CONFIG.REDIS_PORT
  );
  const refreshTokenRepository: IRefreshTokenRepository = new RefreshTokenRepository(redisService);
  const jwtService: IJWTService = new JWTService(CONFIG.ACCESS_TOKEN_SECRET, CONFIG.REFRESH_TOKEN_SECRET);
  const emailService: IEmailService = new BrevoEmailService(CONFIG.BREVO_API_KEY);

  const userService: IUserService = new UserService(userRepository, refreshTokenRepository, jwtService, emailService, redisService);
  const userController = new UserController(userService);

  const problemRepository: IProblemRepository = new ProblemRepository();
  const contestRepository: IContestRepository = new ContestRepository();
  const subscriptionRepository: ISubscriptionRepository = new SubscriptionRepository();
  const subscriptionService: ISubscriptionService = new SubscriptionService(subscriptionRepository, userRepository, redisService);

  const adminService: IAdminService = new AdminService(userRepository, problemRepository, contestRepository, subscriptionRepository);
  const adminController = new AdminController(adminService);

  const problemService: IProblemService = new ProblemService(problemRepository);
  const problemController = new ProblemController(problemService, subscriptionService);

  const discussionRepository: IDiscussionRepository = new DiscussionRepository();
  const discussionService: IDiscussionService = new DiscussionService(discussionRepository, problemRepository);
  const discussionController = new DiscussionController(discussionService);

  const contestService: IContestService = new ContestService(contestRepository);
  const contestController = new ContestController(contestService);

  const subscriptionController = new SubscriptionController(subscriptionService);

  const notificationService: INotificationService = new NotificationService(contestRepository, io!);

  const problemFolderService: ProblemFolderService = new ProblemFolderService(problemRepository);
  
  return {
    userRepository,
    refreshTokenRepository,
    jwtService,
    emailService,
    redisService,
    userService,
    userController,
    adminService,
    adminController,
    problemRepository,
    problemService,
    problemController,
    discussionRepository,
    discussionService,
    discussionController,
    contestRepository,
    contestService,
    contestController,
    subscriptionRepository,
    subscriptionService,
    subscriptionController,
    notificationService,
    problemFolderService,
    io,
  };
};

export const Dependencies = initializeDependencies();

export const initializeWithSocket = (io: Server) => {
  return initializeDependencies(io);
};

export default Dependencies;
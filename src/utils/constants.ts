// Backend\src\constants\routes.ts
export const UserRoutes = {
    SIGNUP: "/signup",
    LOGIN: "/login",
    OTP_VERIFY: "/verify-otp",
    RESEND_OTP: "/resend-otp",
    LOGOUT: "/logout",
    FORGOT_PASSWORD: "/forgot-password",
    VERIFY_FORGOT_PASSWORD_OTP: "/verify-forgot-password-otp",
    RESET_PASSWORD: "/reset-password",
    UPDATE_PROFILE: "/update-profile",
    GOOGLE_LOGIN: "/google-login",
    REFRESH_TOKEN: "/auth/refresh-token",
    CREATE_DISCUSSION: "/discussions",
    GET_DISCUSSIONS: "/discussions/:problemId",
    ADD_REPLY: "/discussions/reply",
    LEADERBOARD: "/leaderboard", 
  
   
  } as const;
  
  export const AdminRoutes = {
    GET_ALL_USERS: "/users",
    GET_USER_BY_ID: "/users/:id",
    BLOCK_USER: "/users/:id/block",
    UNBLOCK_USER: "/users/:id/unblock",
    TOGGLE_BLOCK: "/block-user",
  
    // Problem 
    GET_ALL_PROBLEMS: "/problems",
    CREATE_PROBLEM: "/problems",
    GET_PROBLEM_BY_ID: "/problems/:id",
    UPDATE_PROBLEM: "/problems/:id",
    UPDATE_PROBLEM_STATUS: "/problems/:id/status",
    PROCESS_SPECIFIC_PROBLEM: "/problems/single",
    BLOCK_PROBLEM: "/problems/:id/block",
    UNBLOCK_PROBLEM: "/problems/:id/unblock",
  };
  
  export const ProblemRoutes = {
    GET_ALL_PROBLEMS: "/problems",
    GET_PROBLEM_BY_SLUG: "/problems/:slug",
    GET_SUBMISSIONS: "/submissions",
  
  
    EXECUTE_CODE: "/execute",
  } as const;
  
  
  
  
  export type UserRouteKeys = keyof typeof UserRoutes;
  export type ProblemRouteKeys = keyof typeof ProblemRoutes;
  export type AdminRouteKeys = keyof typeof AdminRoutes;
  
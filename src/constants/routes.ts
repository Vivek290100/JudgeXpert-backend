// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\constants\routes.ts
export const UserRoutes = {
    SIGNUP: "/signup",
    LOGIN: "/login",
    OTP_VERIFY: "/verify-otp",
    RESEND_OTP: "/resend-otp",
    LOGOUT: "/logout",
    FORGOT_PASSWORD: "/forgot-password",
    VERIFY_FORGOT_PASSWORD_OTP: "/verify-forgot-password-otp",
    RESET_PASSWORD: "/reset-password"
} as const;

export const AdminRoutes = {
    GET_ALL_USERS: "/users",
    GET_USER_BY_ID: "/users/:id",
    BLOCK_USER: "/users/:id/block",
    UNBLOCK_USER: "/users/:id/unblock",
    TOGGLE_BLOCK: "/block-user",
  };

export type UserRouteKeys = keyof typeof UserRoutes
export type AdminRouteKeys = keyof typeof AdminRoutes
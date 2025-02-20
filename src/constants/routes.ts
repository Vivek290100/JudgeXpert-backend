// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\constants\routes.ts

// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\constants\routes.ts
export const UserRoutes = {
    SIGNUP: "/signup",
    LOGIN: "/login",
    OTP_VERIFY: "/verify-otp",
    RESEND_OTP: "/resend-otp",
    LOGOUT: "/logout",
    FORGOT_PASSWORD: "/forgot-password",
    VERIFY_FORGOT_PASSWORD_OTP: "/verify-forgot-password-otp", // Added new route
    RESET_PASSWORD: "/reset-password"
} as const;

export type UserRouteKeys = keyof typeof UserRoutes;
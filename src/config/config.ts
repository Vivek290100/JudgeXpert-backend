import dotenv from "dotenv";

dotenv.config(); 

export const CONFIG = {
  PORT: process.env.PORT || 5000,

  NODE_ENV: process.env.NODE_ENV || "development",

  DB_URI: process.env.MONGO_URI || "",

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:4000",

  OTP_EXPIRY_SECONDS: Number(process.env.OTP_EXPIRY_SECONDS) || 300,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "",

  // Gmail Congig
  BREVO_API_KEY: process.env.BREVO_API_KEY || "",

  // AWS S3 Config
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || "judgexpert-images",
  S3_BUCKET_REGION: process.env.S3_BUCKET_REGION || "ap-southeast-2",
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || "",
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || "",

  // Redis Config
  REDIS_USERNAME: process.env.REDIS_USERNAME || "shhhh!",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_HOST: process.env.REDIS_HOST || "",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,

  // github Config
  GIT_CLIENT_ID: process.env.GIT_CLIENT_ID || "",
  GIT_CLIENT_SECRET: process.env.GIT_CLIECT_SECRET || "",
  GIT_CALLBACK_URL: process.env.GIT_CALLBACK_URL || "",

  // Google Config
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "",

  //Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID || "",
  STRIPE_YEARLY_PRICE_ID: process.env.STRIPE_YEARLY_PRICE_ID || "",
};

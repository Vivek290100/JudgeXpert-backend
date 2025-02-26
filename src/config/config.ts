import dotenv from "dotenv";

dotenv.config(); 

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "",
  BREVO_API_KEY: process.env.BREVO_API_KEY || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:4000",
  DB_URI: process.env.MONGO_URI || "", 
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || "judgexpert-images",
  S3_BUCKET_REGION: process.env.S3_BUCKET_REGION || "ap-southeast-2",
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || "",
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || "",
};

// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\database\connectDb.ts
import mongoose from "mongoose";
import { CONFIG } from "../config/Config";

const connectDB = async (): Promise<void> => {
  try {
    const URI: string = CONFIG.DB_URI!;
    await mongoose.connect(URI);
    console.log("🍃 database connected successfully!");
  } catch (error) {
    console.log("Error connecting to database: ", error);
  }
};

export default connectDB;

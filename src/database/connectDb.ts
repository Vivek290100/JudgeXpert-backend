import mongoose from "mongoose";
import { CONFIG } from "../config/config";

const connectDB = async (): Promise<void> => {
  try {
    const URI: string = CONFIG.DB_URI!;
    await mongoose.connect(URI);
    console.log("🍃 database connected successfully!");
  } catch (error) {
    console.log("Database: ", error);
  }
};

export default connectDB;

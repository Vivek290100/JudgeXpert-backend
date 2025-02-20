import mongoose from "mongoose";
import { CONFIG } from "../config/config";

const connectDB = async (): Promise<void> => {
  try {
    const URI: string = CONFIG.DB_URI!;
    if (!URI) {
      throw new Error("URI not found");
    }
    await mongoose.connect(URI);
    console.log("🍃 database connected successfully!");
  } catch (error) {
    console.log("Error connecting to database: ", error);
  }
};

export default connectDB;

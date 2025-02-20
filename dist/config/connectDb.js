"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const URI = process.env.MONGO_URI;
        if (!URI) {
            throw new Error('URI not found');
        }
        await mongoose_1.default.connect(URI);
        console.log('database connected successfully!');
    }
    catch (error) {
        console.log("Error connecting to database: ", error);
    }
};
exports.default = connectDB;

// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import connectDB from "./database/connectDb";
import userRouter from "./routes/UserRoutes";
import { responseLogger } from "./middlewares/logger";
import {CONFIG} from "./config/Config"
import adminRouter from "./routes/AdminRoutes";
import problemRouter from "./routes/ProblemRoutes";


dotenv.config();
connectDB();

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(mongoSanitize());

app.use(
  cors({
    origin: CONFIG.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



app.use(express.json());
app.use(responseLogger); 
app.use(cookieParser());

app.use("/", userRouter);
app.use("/admin", adminRouter)
app.use("/problems", problemRouter);



export default app;

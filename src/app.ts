import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import connectDB from "./database/connectDb";
import userRouter from "./routes/UserRoutes";
import { responseLogger } from "./middlewares/logger";
import {CONFIG} from "./config/config"
import adminRouter from "./routes/AdminRoutes";

dotenv.config();
connectDB();

const app = express();
app.set("trust proxy", 1);

// app.use(helmet());
// app.use(mongoSanitize());

app.use(
  cors({
    origin: CONFIG.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", CONFIG.FRONTEND_URL);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.sendStatus(204);
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));


app.use(mongoSanitize());

app.use("/subscriptions/webhook", express.raw({ type: "application/json" }));


app.use(express.json());
app.use(responseLogger); 
app.use(cookieParser());

app.use("/", userRouter);
app.use("/admin", adminRouter)

export default app;
   
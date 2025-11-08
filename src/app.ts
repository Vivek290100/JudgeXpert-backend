import express, { RequestHandler } from "express";
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

app.use(((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", CONFIG.FRONTEND_URL);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    return res.status(204).end();
  }
  next();
}) as RequestHandler);

app.use(
  cors({
    origin: CONFIG.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


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
   
console.log("⏳ Starting server...");
import { createServer } from "http";
import app from "./app";
import dotenv from "dotenv";
import initializeSocket from "./utils/socket";
import cron from "node-cron";
import { initializeWithSocket } from "./utils/dependencies";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = createServer(app);
const io = initializeSocket(server);
const Dependencies = initializeWithSocket(io);

cron.schedule("*/10 * * * * *", async () => {
  try {
    await Dependencies.notificationService!.checkAndNotifyStartingContests();
  } catch (error) {
    console.error("Error checking starting contests:", error);
  }
});

server.listen(PORT, () => {
  console.log(`🌐 http://localhost:${PORT}`);
});


export { app, io, server };

console.log("⏳ Starting server...");
import { createServer } from "http";
import app from "./app";
import dotenv from "dotenv";
import initializeSocket from "./utils/socket";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = createServer(app);
const io = initializeSocket(server);

server.listen(PORT, () => {
  console.log(`🌐 http://localhost:${PORT}`);
});


export { app, io, server };

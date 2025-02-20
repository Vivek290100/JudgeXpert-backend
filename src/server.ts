// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\server.ts
console.log("Starting server...");
import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🌐 Server running http://localhost:${PORT}`);
});

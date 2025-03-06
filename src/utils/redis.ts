// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\redis.ts
import { createClient } from "redis";
import { CONFIG } from "../config/Config";


const client = createClient({
  username: CONFIG.REDIS_USERNAME,
  password: CONFIG.REDIS_PASSWORD,
  socket: {
    host: CONFIG.REDIS_HOST,
    port: CONFIG.REDIS_PORT,
  },
});

client.on('error', err => console.log('Redis Client Error', err));

(async () => {
  try {
    await client.connect();
    console.log("🌏 Redis Connected ");
    await client.set("test-key", "Redis is working!");
  } catch (error) {
    console.error("Redis Connection Failed:", error);
  }
})();

export default client;

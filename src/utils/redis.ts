// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\redis.ts
import { createClient } from "redis";

const client = createClient({
  username: "default",
  password: "ldGr3GtghOrWQTLOTgv5ew3eCKZLWBY6",
  socket: {
    host: "redis-11823.c301.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 11823,
  },
});

client.on('error', err => console.log('Redis Client Error', err));

(async () => {
  try {
    await client.connect();
    console.log("🌏 Redis Connected ");
    await client.set("test-key", "Redis is working!");
    // const value = await client.get("test-key");
    // console.log("Redis Test Value:", value);
  } catch (error) {
    console.error("Redis Connection Failed:", error);
  }
})();

export default client;

// utils/redis.ts
import { createClient, RedisClientType } from "redis";
import { IRedisService } from "../interfaces/utilInterfaces/IRedisService";

class RedisService implements IRedisService {
  private client: RedisClientType;

  constructor(
    username: string,
    password: string,
    host: string,
    port: number
  ) {
    this.client = createClient({
      username,
      password,
      socket: {
        host,
        port,
      },
    });

    this.client.on("error", (err) => console.log("Redis Client Error", err));

    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log("🌏 Redis Connected ");
      await this.client.set("test-key", "Redis is working!");
    } catch (error) {
      console.error("Redis Connection Failed:", error);
      throw error; // Propagate error to be handled by the caller
    }
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    await this.client.set(key, value, options);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Optional: Add a disconnect method if needed
  async disconnect(): Promise<void> {
    await this.client.disconnect();
    console.log("🌏 Redis Disconnected");
  }
}

export default RedisService;

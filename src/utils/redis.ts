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
      throw error;
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

  async disconnect(): Promise<void> {
    await this.client.disconnect();
    console.log("🌏 Redis Disconnected");
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  // Try to set the key with NX (only if it doesn't exist) and EX (expire time)
  const result = await this.client.set(key, "locked", { NX: true, EX: ttlSeconds });
  return result === "OK";
}

async releaseLock(key: string): Promise<void> {
  await this.client.del(key);
}

async hasLock(key: string): Promise<boolean> {
  const value = await this.client.get(key);
  return value !== null;
}
}

export default RedisService;

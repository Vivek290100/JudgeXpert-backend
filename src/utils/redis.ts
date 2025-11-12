import { createClient, RedisClientType } from "redis";
import { IRedisService } from "../interfaces/utilInterfaces/IRedisService";

class RedisService implements IRedisService {
  private client: RedisClientType;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor(username: string, password: string, host: string, port: number) {
    this.client = createClient({
      username,
      password,
      socket: {
        host,
        port,
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 500, 5000);
          console.log(`🔁 Redis reconnecting in ${delay}ms...`);
          return delay;
        },
      },
    });

    this.client.on("error", (err) => {
      console.error("❌ Redis Client Error:", err.message);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      console.log("✅ Redis socket connected (handshake started)");
    });

    this.client.on("ready", () => {
      console.log("🌏 Redis Ready");
      this.isConnected = true;
    });

    this.client.on("end", () => {
      console.warn("⚠️ Redis connection closed");
      this.isConnected = false;
    });

    this.connect();
    this.startKeepAlive();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.isConnected = true;
      console.log("🌏 Redis Connected");
    } catch (error) {
      console.error("Redis Connection Failed:", error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private startKeepAlive(): void {
    this.reconnectInterval = setInterval(async () => {
      if (!this.isConnected) return;
      try {
        await this.client.ping();
        console.log("💓 Redis keepalive ping successful");
      } catch (err) {
        console.error("💀 Redis keepalive failed:", err);
      }
    }, 5 * 60 * 1000);
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
    if (this.reconnectInterval) clearInterval(this.reconnectInterval);
    await this.client.disconnect();
    console.log("🌏 Redis Disconnected");
  }

  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
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

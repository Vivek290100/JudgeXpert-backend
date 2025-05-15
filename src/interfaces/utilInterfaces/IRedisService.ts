// interfaces/utilInterfaces/IRedisService.ts
export interface IRedisService {
    set(key: string, value: string, options?: { EX?: number }): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    acquireLock(key: string, ttlSeconds: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
  hasLock(key: string): Promise<boolean>;
  disconnect(): Promise<void>;
  }
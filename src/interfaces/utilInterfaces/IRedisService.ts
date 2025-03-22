// interfaces/utilInterfaces/IRedisService.ts
export interface IRedisService {
    set(key: string, value: string, options?: { EX?: number }): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
  }
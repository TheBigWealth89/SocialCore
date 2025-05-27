// src/utils/redis.ts
import { createClient } from "redis";

class RedisService {
  private client;

  constructor() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.client = createClient({ url: redisUrl });

    this.client.on("error", (err) => {
      console.error("Redis Error:", err);
    });

    this.client.on("connect", () => {
      console.log("✅ Connected to Redis:", redisUrl);
    });

    this.client.on("reconnecting", () => {
      console.warn("🔁 Reconnecting to Redis...");
    });
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async blacklistToken(token: string, expirySeconds: number) {
    await this.client.set(`bl_${token}`, "1", {
      EX: expirySeconds,
    });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.get(`bl_${token}`);
    return result !== null;
  }

  async removeToken(token: string) {
    await this.client.del(token);
  }
}

export default new RedisService();

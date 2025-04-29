import { createClient } from "redis";

class RedisService {
  static async removeToken(tokenKey: string) {
    const service = new RedisService();
    await service.connect();
    if (service.client) {
      await service.client.del(tokenKey);
    } else {
      throw new Error("Redis client is not initialized.");
    }
  }

  client: ReturnType<typeof createClient> | undefined;
  getAsync: any;
  setAsync: any;
  ttlAsync: any;
  delAsync: any;
  expireAsync: (key: string, seconds: number) => Promise<boolean>;
  static connect: any;

  constructor() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"; // Fallback to localhost
    this.client = createClient({ url: redisUrl });

    this.client.on("error", (err) => {
      console.error("Redis error:", err);
    });

    this.client.on("connect", () => {
      console.log("Connected to Redis server at", redisUrl);
    });

    this.client.on("reconnecting", () => {
      console.warn("Reconnecting to Redis server...");
    });

    this.getAsync = this.client.get.bind(this.client);
    this.setAsync = this.client.set.bind(this.client);
    this.delAsync = this.client.del.bind(this.client);
    this.expireAsync = this.client.expire.bind(this.client);
    this.ttlAsync = this.client.ttl.bind(this.client);
  }

  async connect() {
    try {
      await this.client?.connect();
    } catch (err) {
      console.error("Failed to connect to Redis server:", err);
      throw err;
    }
  }

  async blacklistToken(token: string, expirySeconds: number) {
    if (this.client) {
      await this.client.set(`bl_${token}`, "1");
      await this.client.expire(`bl_${token}`, expirySeconds);
    } else {
      throw new Error("Redis client is not initialized.");
    }
  }

  async isTokenBlacklisted(token: string) {
    if (!this.client) {
      throw new Error("Redis client is not initialized.");
    }
    const result = await this.client.get(`bl_${token}`);
    return result !== null;
  }

  /**
   *
   *
   * @static
   * @param {string} token
   * @param {number} expirySeconds
   * @memberof RedisService
   */
  static async blacklistToken(token: string, expirySeconds: number) {
    const service = new RedisService();
    await service.connect();
    await service.blacklistToken(token, expirySeconds);
  }

  
  /**
   *
   *
   * @static
   * @param {string} token
   * @return {*} 
   * @memberof RedisService
   */
  static async isTokenBlacklisted(token: string) {
    const service = new RedisService();
    await service.connect();
    return await service.isTokenBlacklisted(token);
  }
}

export default RedisService;

import { Types } from "mongoose";
import mongoose from "mongoose";
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config/config";
import RedisService from "../services/redis.services";
import RefreshToken from "../models/RefreshToken";
import crypto from "crypto";
interface TokenPayload {
  userId: Types.ObjectId;
  roles?: string[]; 
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

//Generate (access + refresh)
export const generateTokens = (payload: TokenPayload): TokenPair => {
  if (!config.jwt.ACCESS_SECRET || !config.jwt.REFRESH_SECRET) {
    throw new Error("JWT secrets are missing");
  }

  // Ensure payload contains standard claims
  const fullPayload = {
    ...payload,
    iss: "BLOG", // Issuer
    iat: Math.floor(Date.now() / 1000), // Issued at
  };

  const accessTokenOptions: SignOptions = {
    expiresIn: "15m",
  };

  const refreshTokenOptions: SignOptions = {
    expiresIn: "7d",
  };

  const accessToken = jwt.sign(fullPayload, config.jwt.ACCESS_SECRET, {
    ...accessTokenOptions,
    algorithm: "HS256", // Explicitly set algorithm
  });

  // //Debugging console
  // const decodedAccessToken = jwt.decode(accessToken) as {
  //   exp?: number;
  //   iat?: number;
  // };
  // console.log(
  //   "Access Token Expires At (exp):",
  //   decodedAccessToken?.exp
  //     ? new Date(decodedAccessToken.exp * 1000).toISOString()
  //     : "N/A"
  // );
  // console.log(
  //   "Access Token Issued At (iat):",
  //   decodedAccessToken?.iat
  //     ? new Date(decodedAccessToken.iat * 1000).toISOString()
  //     : "N/A"
  // );
  // console.log("Configured Access Token Expiry:", config.jwt.jwt_access_expiry);

  const refreshToken = jwt.sign(
    payload,
    config.jwt.REFRESH_SECRET,
    refreshTokenOptions
  );

  return { accessToken, refreshToken };
};

export const removeRefreshToken = async (refreshToken: string) => {
  const hashed = "TEST_" + hashedToken(refreshToken);
  return RefreshToken.deleteOne({ token: hashed });
};

export const verifyAccessToken = async (
  token: string
): Promise<TokenPayload | null> => {
  try {
    // Check if the token is blacklisted
    const isBlacklisted = await RedisService.isTokenBlacklisted(token);
    if (isBlacklisted === true) {
      throw new Error("Token has been blacklisted");
    }

    // Verify the token
    return jwt.verify(token, config.jwt.ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error verifying access token:", error.message);
    } else {
      console.error("Error verifying access token:", error);
    }
    return null; // Return null if verification fails
  }
};

// Function hashed refresh token
const hashedToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const saveRefreshToken = async (
  userId: Types.ObjectId,
  refreshToken: string
) => {
  const hashed = hashedToken(refreshToken);
  // Delete ALL existing tokens for this user first
  await RefreshToken.deleteMany({ user: userId });
  // Create new token record
  return await RefreshToken.create({
    user: userId,
    token: "TEST_" + hashed,
  });
};
export const verifyRefreshToken = async (
  token: string
): Promise<TokenPayload | null> => {
  if (!token) {
    console.log("No token provided");
    return null;
  }

  // First verify the JWT signature
  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, config.jwt.REFRESH_SECRET) as TokenPayload;
    console.log("Token signature valid for user:", payload.userId);
  } catch (err) {
    console.error("Invalid token signature:", err);
    return null;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const hashed = "TEST_" + hashedToken(token);
    // Critical change: Only look for the exact token string provided
    const tokenDoc = await RefreshToken.findOneAndDelete(
      {
        token: hashed,
        user: payload.userId,
      },
      { session }
    );

    if (!tokenDoc) {
      console.log("EXACT token not found in database");
      await session.abortTransaction();
      return null;
    }

    await session.commitTransaction();
    return payload;
  } catch (err) {
    await session.abortTransaction();
    console.error("Database operation failed:", err);
    return null;
  } finally {
    session.endSession();
  }
};
//Add token to blacklist
export const addToBlacklist = async (token: string) => {
  try {
    const decoded = jwt.decode(token);
    console.log(decoded);
    if (decoded && typeof decoded === "object" && "exp" in decoded) {
      const currentTime = Math.floor(Date.now() / 1000);
      console.log(
        "Server Time (at blacklist):",
        new Date(currentTime * 1000).toISOString()
      );
      const ttl = decoded.exp !== undefined ? decoded.exp - currentTime : 0;
      console.log(
        "Token Expiry (exp):",
        new Date((decoded.exp || 0) * 1000).toISOString()
      );
      console.log("Calculated TTL:", ttl);
      if (ttl > 0) {
        await RedisService.blacklistToken(token, ttl);
        console.log("Token successfully blacklisted");
      } else {
        console.log(
          "Token already expired or no expiry found, not blacklisting."
        );
      }
    }
  } catch (err) {
    console.error("Blacklist error:", err);
    throw err;
  }
};

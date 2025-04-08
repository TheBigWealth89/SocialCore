import { Types } from "mongoose";
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config/config";

interface TokenPayload {
  userId: Types.ObjectId;
  role?: string; //user or admin
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

//Generate (access + refresh)
export const generateTokens = (payload: TokenPayload): TokenPair => {
  if (!config.jwt.accessTokenSecret || !config.jwt.refreshTokenSecret) {
    throw new Error("err");
  }

  const accessTokenOPtions: SignOptions = {
    expiresIn: parseInt(config.jwt.accessTokenExpiry),
  };

  const refresfTokenOptions: SignOptions = {
    expiresIn: parseInt(config.jwt.refreshTokenExpiry),
  };

  const accessToken = jwt.sign(
    payload, // Data to store
    config.jwt.accessTokenSecret,
    accessTokenOPtions
  );
  const refreshToken = jwt.sign(
    payload,
    config.jwt.refreshTokenSecret,
    refresfTokenOptions
  );
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessTokenSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshTokenSecret) as TokenPayload;
};

// Generate reset token
export const generateResetToken = (userId: Types.ObjectId): string => {
  if (!config.jwt.resetTokenSecret || !config.jwt.resetTokenExpiry) {
    throw new Error("reset err");
  }
  const resetTokenOptions: SignOptions = {
    expiresIn: parseInt(config.jwt.resetTokenExpiry),
  };

  const resetToken = jwt.sign(
    userId,
    config.jwt.resetTokenSecret,
    resetTokenOptions
  );
  return resetToken;
};

//verify reset Token
export const verifyResetToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.resetTokenSecret!) as TokenPayload;
};

//Token blacklistManagement using Redis
const tokenBlacklist = new Set<string>();

export const addToBlacklist = (token: string) => {
  tokenBlacklist.add(token);
};

export const isTokenBlacklisted = (token: string): boolean => {
  console.log(tokenBlacklist);
  return tokenBlacklist.has(token);
};

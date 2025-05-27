import { Request, Response, NextFunction } from "express";
import { LoginError } from "../error/customErrors";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Global Error Handler:", err.stack || err);

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).reduce<Record<string, string>>(
      (acc, { path, message }) => {
        acc[path] = message;
        return acc;
      },
      {}
    );
    res.status(400).json({ errors });
    return;
  }

  // Mongo duplicate key error
  if (err instanceof MongoServerError && err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    res.status(409).json({
      errors: { [field]: `${field} already exists` },
    });
    return;
  }

  // Custom LoginError
  if (err instanceof LoginError) {
    res.status(err.statusCode).json({
      errors: { general: err.message },
      code: err.statusCode,
    });
    return;
  }

  // Generic error
  const statusCode = err.statusCode || err.status || 500;
  const message =
    err.message || "An unexpected internal server error occurred.";

  res.status(statusCode).json({
    errors: {
      general:
        process.env.NODE_ENV === "development"
          ? message
          : "An unexpected internal server error occurred. Please try again.",
    },
  });
};

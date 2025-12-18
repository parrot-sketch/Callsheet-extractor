import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid request data",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  // Application errors
  if (err instanceof AppError) {
    logger.warn("Application error:", {
      statusCode: err.statusCode,
      message: err.message,
      path: req.path,
    });

    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Unexpected errors
  logger.error("Unexpected error:", {
    error: err,
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  return res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}


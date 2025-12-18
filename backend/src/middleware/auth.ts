/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens from Supabase Auth and attaches user to request.
 */

import { Request, Response, NextFunction } from "express";
import { getSupabaseAuth } from "../database/supabase-auth.js";
import { logger } from "../utils/logger.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * Middleware to verify JWT token and attach user to request.
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseAuth();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn("Authentication failed", { error: error?.message });
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication processing failed",
    });
  }
}

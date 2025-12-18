import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Middleware factory for request validation using Zod schemas.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Invalid request data",
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}


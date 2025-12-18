import { Router } from "express";
import { z } from "zod";
import { ProductionService } from "../services/production.service.js";
import { ProductionRepository } from "../repositories/production.repository.js";
import { UploadRepository } from "../repositories/upload.repository.js";
import { ContactRepository } from "../repositories/contact.repository.js";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";
import { AppError } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Initialize services
const productionService = new ProductionService(
  new ProductionRepository(),
  new UploadRepository(),
  new ContactRepository(),
);

// Validation schemas
const processUploadSchema = z.object({
  body: z.object({
    productionName: z.string().min(1, "Production name is required"),
    filename: z.string().min(1, "Filename is required"),
    documentContent: z.string().min(1, "Document content is required"),
    documentType: z.string().nullable().optional(),
  }),
});

const listProductionsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

const getProductionDetailSchema = z.object({
  query: z.object({
    productionId: z.string().uuid("Invalid production ID"),
  }),
});

/**
 * POST /api/v1/productions/upload
 * Process a call sheet upload
 */
router.post(
  "/upload",
  authenticate,
  validate(processUploadSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { productionName, filename, documentContent, documentType } = req.body;

      const result = await productionService.processUpload(
        productionName,
        filename,
        documentContent,
        documentType,
      );

      logger.info("Upload processed", {
        userId: req.user?.id,
        productionId: result.production_id,
        uploadId: result.upload_id,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/productions
 * List productions
 */
router.get(
  "/",
  authenticate,
  validate(listProductionsSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { search, limit } = req.query as { search?: string; limit?: number };

      const result = await productionService.listProductions(search, limit);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/productions/detail
 * Get production detail
 */
router.get(
  "/detail",
  authenticate,
  validate(getProductionDetailSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { productionId } = req.query as { productionId: string };

      const detail = await productionService.getProductionDetail(productionId);

      if (!detail) {
        throw new AppError(404, "Production not found");
      }

      res.json(detail);
    } catch (error) {
      next(error);
    }
  },
);

export default router;


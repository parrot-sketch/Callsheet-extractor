import { Router } from "express";
import { z } from "zod";
import { extractContacts } from "../services/extraction.service.js";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth.js";
import { validate } from "../middleware/validator.js";

const router = Router();

// Validation schema
const extractSchema = z.object({
  body: z.object({
    documentContent: z.string().min(1, "Document content is required"),
    documentType: z.string().nullable().optional(),
  }),
});

/**
 * POST /api/v1/extraction/extract
 * Extract contacts from document (low-level AI endpoint)
 */
router.post(
  "/extract",
  authenticate,
  validate(extractSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { documentContent, documentType } = req.body;

      const result = await extractContacts(documentContent, documentType);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;


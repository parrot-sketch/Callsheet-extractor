/**
 * Image Document Processor
 * 
 * Handles image documents (PNG, JPG, JPEG, GIF, WebP).
 * Images are passed directly to the vision API.
 */

import { logger } from "../../../utils/logger.js";
import type { DocumentProcessor, ProcessorResult } from "../types.js";

const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
];

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB limit for OpenAI vision

export class ImageProcessor implements DocumentProcessor {
  canProcess(dataUrl: string, mimeType?: string): boolean {
    // Check data URL prefix
    if (dataUrl.startsWith("data:image/")) {
      return true;
    }

    // Check explicit mime type
    if (mimeType && SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
      return true;
    }

    return false;
  }

  async process(dataUrl: string, filename: string): Promise<ProcessorResult> {
    try {
      logger.info("Processing image document", { filename });

      // Extract mime type from data URL
      const mimeMatch = dataUrl.match(/^data:(image\/[a-z]+);base64,/);
      if (!mimeMatch) {
        return {
          success: false,
          error: "Invalid image data URL format",
        };
      }

      const mimeType = mimeMatch[1];
      
      // Validate image type
      if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
        return {
          success: false,
          error: `Unsupported image type: ${mimeType}. Supported: PNG, JPG, GIF, WebP`,
        };
      }

      // Calculate approximate size
      const base64Data = dataUrl.split(",")[1];
      const approximateSize = Math.ceil((base64Data.length * 3) / 4);

      if (approximateSize > MAX_IMAGE_SIZE) {
        return {
          success: false,
          error: `Image too large (${(approximateSize / 1024 / 1024).toFixed(1)}MB). Maximum size is 20MB.`,
        };
      }

      logger.info("Image validated", {
        filename,
        mimeType,
        approximateSize: `${(approximateSize / 1024).toFixed(1)}KB`,
      });

      return {
        success: true,
        document: {
          type: "image",
          images: [dataUrl],
          metadata: {
            originalFilename: filename,
            mimeType,
            size: approximateSize,
          },
          strategy: "vision",
          requiresVision: true,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown image processing error";
      logger.error("Image processing failed", { error: message, filename });

      return {
        success: false,
        error: `Image processing failed: ${message}`,
      };
    }
  }
}


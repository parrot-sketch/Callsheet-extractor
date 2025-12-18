/**
 * Word Document Processor
 * 
 * Handles Microsoft Word documents (.docx) using mammoth.
 * Extracts text content for AI processing.
 */

import mammoth from "mammoth";
import { logger } from "../../../utils/logger.js";
import type { DocumentProcessor, ProcessorResult } from "../types.js";

const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 50000; // Limit for AI processing (tokens consideration)

export class WordProcessor implements DocumentProcessor {
  canProcess(dataUrl: string, mimeType?: string): boolean {
    return (
      dataUrl.startsWith("data:application/vnd.openxmlformats-officedocument.wordprocessingml") ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    );
  }

  async process(dataUrl: string, filename: string): Promise<ProcessorResult> {
    try {
      logger.info("Processing Word document", { filename });

      // Extract base64 data
      const base64Match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (!base64Match) {
        return {
          success: false,
          error: "Invalid Word document data URL format",
        };
      }

      const docBuffer = Buffer.from(base64Match[1], "base64");

      // Extract text using mammoth
      const result = await mammoth.extractRawText({ buffer: docBuffer });
      let textContent = result.value || "";

      // Log any warnings
      if (result.messages.length > 0) {
        logger.warn("Word extraction warnings", {
          warnings: result.messages.map((m) => m.message),
        });
      }

      // Validate content
      if (textContent.trim().length < MIN_TEXT_LENGTH) {
        return {
          success: false,
          error: `Word document has insufficient text content (${textContent.trim().length} characters).`,
        };
      }

      // Truncate if too long (keep first part which usually has contact info)
      if (textContent.length > MAX_TEXT_LENGTH) {
        logger.info("Truncating large Word document", {
          originalLength: textContent.length,
          truncatedLength: MAX_TEXT_LENGTH,
        });
        textContent = textContent.substring(0, MAX_TEXT_LENGTH) + 
          "\n\n[Document truncated - showing first 50,000 characters]";
      }

      logger.info("Word document processed", {
        filename,
        textLength: textContent.length,
      });

      return {
        success: true,
        document: {
          type: "text",
          textContent,
          metadata: {
            originalFilename: filename,
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size: docBuffer.length,
          },
          strategy: "text-extraction",
          requiresVision: false,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Word processing error";
      logger.error("Word document processing failed", { error: message, filename });

      return {
        success: false,
        error: `Word document processing failed: ${message}`,
      };
    }
  }
}


/**
 * Text Document Processor
 * 
 * Handles plain text content (pasted text, .txt files).
 * Includes smart truncation for large documents.
 */

import { logger } from "../../../utils/logger.js";
import type { DocumentProcessor, ProcessorResult } from "../types.js";

const MIN_TEXT_LENGTH = 10; // Minimum chars for valid content
const MAX_TEXT_LENGTH = 50000; // ~50KB - reasonable limit for AI processing

export class TextProcessor implements DocumentProcessor {
  canProcess(dataUrl: string, mimeType?: string): boolean {
    // Plain text (not a data URL)
    if (!dataUrl.startsWith("data:")) {
      return true;
    }

    // Text data URL
    if (dataUrl.startsWith("data:text/")) {
      return true;
    }

    // Explicit text mime type
    if (mimeType?.startsWith("text/")) {
      return true;
    }

    return false;
  }

  async process(dataUrl: string, filename: string): Promise<ProcessorResult> {
    try {
      logger.info("Processing text document", { filename });

      let textContent: string;

      if (dataUrl.startsWith("data:text/")) {
        // Decode base64 text data URL
        const base64Match = dataUrl.match(/^data:text\/[^;]+;base64,(.+)$/);
        if (base64Match) {
          textContent = Buffer.from(base64Match[1], "base64").toString("utf-8");
        } else {
          // URL-encoded text
          const dataMatch = dataUrl.match(/^data:text\/[^,]+,(.+)$/);
          textContent = dataMatch ? decodeURIComponent(dataMatch[1]) : dataUrl;
        }
      } else {
        // Plain text content
        textContent = dataUrl;
      }

      // Validate content
      if (textContent.trim().length < MIN_TEXT_LENGTH) {
        return {
          success: false,
          error: `Text content too short. Please provide at least ${MIN_TEXT_LENGTH} characters.`,
        };
      }

      // Smart truncation for large documents
      if (textContent.length > MAX_TEXT_LENGTH) {
        logger.info("Truncating large text content", {
          originalLength: textContent.length,
          truncatedLength: MAX_TEXT_LENGTH,
          filename,
        });
        
        textContent = this.smartTruncate(textContent, MAX_TEXT_LENGTH);
      }

      logger.info("Text content validated", {
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
            mimeType: "text/plain",
            size: textContent.length,
          },
          strategy: "direct-text",
          requiresVision: false,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown text processing error";
      logger.error("Text processing failed", { error: message, filename });

      return {
        success: false,
        error: `Text processing failed: ${message}`,
      };
    }
  }

  /**
   * Smart truncation that tries to keep complete sections.
   * Prioritizes the beginning of the document (where contact info usually is).
   */
  private smartTruncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Find a good break point (paragraph or sentence)
    const targetLength = maxLength - 100; // Leave room for truncation notice
    let breakPoint = text.lastIndexOf("\n\n", targetLength);
    
    if (breakPoint === -1 || breakPoint < targetLength * 0.7) {
      // Try single newline
      breakPoint = text.lastIndexOf("\n", targetLength);
    }
    
    if (breakPoint === -1 || breakPoint < targetLength * 0.7) {
      // Try sentence end
      breakPoint = text.lastIndexOf(". ", targetLength);
      if (breakPoint !== -1) breakPoint += 1; // Include the period
    }
    
    if (breakPoint === -1 || breakPoint < targetLength * 0.7) {
      // Hard cut
      breakPoint = targetLength;
    }

    return text.substring(0, breakPoint).trim() + 
      "\n\n[Document truncated - showing first ~50,000 characters. Contact information is typically in the first section.]";
  }
}

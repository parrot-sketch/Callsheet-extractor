/**
 * Document Processing Module
 * 
 * Enterprise-grade document processing pipeline using the Strategy pattern.
 * Automatically detects document type and routes to the appropriate processor.
 * 
 * Supported formats:
 * - PDF (text-based and scanned/image-based via Poppler)
 * - Word documents (.docx)
 * - Excel spreadsheets (.xlsx, .xls)
 * - Images (PNG, JPG, GIF, WebP)
 * - Plain text
 */

import { logger } from "../../utils/logger.js";
import { PdfProcessor } from "./processors/pdf.processor.js";
import { WordProcessor } from "./processors/word.processor.js";
import { ExcelProcessor } from "./processors/excel.processor.js";
import { ImageProcessor } from "./processors/image.processor.js";
import { TextProcessor } from "./processors/text.processor.js";
import type { DocumentProcessor, ProcessorResult, DocumentType } from "./types.js";

// Re-export types
export * from "./types.js";

/**
 * Document Processing Service
 * 
 * Coordinates document processing using registered processors.
 * Uses Chain of Responsibility pattern for processor selection.
 */
class DocumentProcessingService {
  private processors: DocumentProcessor[] = [];

  constructor() {
    // Register processors in order of specificity (most specific first)
    this.registerProcessor(new PdfProcessor());
    this.registerProcessor(new WordProcessor());
    this.registerProcessor(new ExcelProcessor());
    this.registerProcessor(new ImageProcessor());
    this.registerProcessor(new TextProcessor()); // Fallback for plain text
  }

  /**
   * Register a document processor.
   */
  registerProcessor(processor: DocumentProcessor): void {
    this.processors.push(processor);
  }

  /**
   * Detect the document type from content and optional hints.
   */
  detectType(content: string, mimeTypeHint?: string): DocumentType {
    if (content.startsWith("data:application/pdf") || mimeTypeHint === "application/pdf") {
      return "pdf";
    }

    if (content.startsWith("data:image/") || mimeTypeHint?.startsWith("image/")) {
      return "image";
    }

    if (
      content.startsWith("data:text/") ||
      mimeTypeHint?.startsWith("text/") ||
      !content.startsWith("data:")
    ) {
      return "text";
    }

    return "unknown";
  }

  /**
   * Process a document through the appropriate processor.
   */
  async process(
    content: string,
    filename: string,
    mimeTypeHint?: string,
  ): Promise<ProcessorResult> {
    const detectedType = this.detectType(content, mimeTypeHint);
    
    logger.info("Processing document", {
      filename,
      detectedType,
      mimeTypeHint,
      contentLength: content.length,
    });

    // Find appropriate processor
    for (const processor of this.processors) {
      if (processor.canProcess(content, mimeTypeHint)) {
        const result = await processor.process(content, filename);
        
        if (result.success) {
          logger.info("Document processed successfully", {
            filename,
            strategy: result.document?.strategy,
            requiresVision: result.document?.requiresVision,
          });
        } else {
          logger.warn("Document processing failed", {
            filename,
            error: result.error,
          });
        }

        return result;
      }
    }

    // No processor found
    logger.error("No processor found for document", {
      filename,
      detectedType,
      mimeTypeHint,
    });

    return {
      success: false,
      error: `Unsupported document format. Supported formats: PDF, Word (.docx), Excel (.xlsx), PNG, JPG, GIF, WebP, plain text.`,
    };
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessingService();

// Export class for testing
export { DocumentProcessingService };

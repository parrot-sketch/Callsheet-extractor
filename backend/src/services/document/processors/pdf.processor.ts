/**
 * PDF Document Processor
 * 
 * Enterprise-grade PDF processing using Poppler utils (native binaries).
 * Supports both text-based and scanned (image-based) PDFs.
 * 
 * Requirements:
 * - poppler-utils installed (apt install poppler-utils)
 * - Provides: pdftotext, pdftoppm commands
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, readdir, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { logger } from "../../../utils/logger.js";
import type { DocumentProcessor, ProcessorResult } from "../types.js";

const execAsync = promisify(exec);

const MIN_TEXT_LENGTH_THRESHOLD = 100; // Minimum chars to consider PDF as text-based
const MAX_PAGES_FOR_VISION = 5; // Limit pages converted to images
const IMAGE_DPI = 150; // DPI for image conversion (balance quality/size)

export class PdfProcessor implements DocumentProcessor {
  canProcess(dataUrl: string, mimeType?: string): boolean {
    return (
      dataUrl.startsWith("data:application/pdf") ||
      mimeType === "application/pdf"
    );
  }

  async process(dataUrl: string, filename: string): Promise<ProcessorResult> {
    // Create temp directory for this processing job
    const jobId = randomUUID();
    const tempDir = join(tmpdir(), `callsheet-pdf-${jobId}`);
    const pdfPath = join(tempDir, "input.pdf");

    try {
      logger.info("Processing PDF with Poppler", { filename, jobId });

      // Create temp directory
      await mkdir(tempDir, { recursive: true });

      // Extract base64 data and write to temp file
      const base64Match = dataUrl.match(/^data:application\/pdf;base64,(.+)$/);
      if (!base64Match) {
        return {
          success: false,
          error: "Invalid PDF data URL format",
        };
      }

      const pdfBuffer = Buffer.from(base64Match[1], "base64");
      await writeFile(pdfPath, pdfBuffer);

      // Get PDF info
      const pageCount = await this.getPageCount(pdfPath);
      logger.info("PDF loaded", { filename, pageCount, jobId });

      // Try text extraction first
      const textContent = await this.extractText(pdfPath);
      const hasSignificantText = textContent.trim().length >= MIN_TEXT_LENGTH_THRESHOLD;

      if (hasSignificantText) {
        // Text-based PDF - use text extraction
        logger.info("PDF has extractable text", {
          filename,
          textLength: textContent.length,
          jobId,
        });

        // Cleanup temp files
        await this.cleanup(tempDir);

        return {
          success: true,
          document: {
            type: "pdf",
            textContent,
            metadata: {
              originalFilename: filename,
              mimeType: "application/pdf",
              size: pdfBuffer.length,
              pageCount,
            },
            strategy: "text-extraction",
            requiresVision: false,
          },
        };
      }

      // Scanned PDF - convert to images for vision processing
      logger.info("PDF appears to be scanned/image-based, converting to images", {
        filename,
        textLength: textContent.length,
        jobId,
      });

      const images = await this.convertToImages(pdfPath, tempDir, pageCount);

      // Cleanup temp files
      await this.cleanup(tempDir);

      if (images.length === 0) {
        return {
          success: false,
          error: "Failed to convert PDF to images. The file may be corrupted.",
        };
      }

      return {
        success: true,
        document: {
          type: "pdf",
          images,
          metadata: {
            originalFilename: filename,
            mimeType: "application/pdf",
            size: pdfBuffer.length,
            pageCount,
          },
          strategy: "vision",
          requiresVision: true,
        },
      };
    } catch (error) {
      // Cleanup on error
      await this.cleanup(tempDir).catch(() => {});

      const message = error instanceof Error ? error.message : "Unknown PDF processing error";
      logger.error("PDF processing failed", { error: message, filename, jobId });

      // Check if it's a Poppler not found error
      if (message.includes("not found") || message.includes("ENOENT")) {
        return {
          success: false,
          error: "PDF processing tools not installed. Please install poppler-utils.",
        };
      }

      return {
        success: false,
        error: `PDF processing failed: ${message}`,
      };
    }
  }

  /**
   * Get page count from PDF using pdfinfo or pdftotext
   */
  private async getPageCount(pdfPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(`pdfinfo "${pdfPath}" 2>/dev/null | grep "Pages:" | awk '{print $2}'`);
      const count = parseInt(stdout.trim(), 10);
      return isNaN(count) ? 1 : count;
    } catch {
      // Fallback if pdfinfo not available
      return 1;
    }
  }

  /**
   * Extract text content from PDF using pdftotext
   */
  private async extractText(pdfPath: string): Promise<string> {
    try {
      // -layout preserves the original layout
      // -enc UTF-8 ensures proper encoding
      const { stdout } = await execAsync(`pdftotext -layout -enc UTF-8 "${pdfPath}" -`, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large PDFs
      });
      return stdout;
    } catch (error) {
      logger.warn("Text extraction failed, PDF may be image-based", {
        error: error instanceof Error ? error.message : "Unknown",
      });
      return "";
    }
  }

  /**
   * Convert PDF pages to PNG images using pdftoppm
   */
  private async convertToImages(pdfPath: string, tempDir: string, pageCount: number): Promise<string[]> {
    const images: string[] = [];
    const pagesToConvert = Math.min(pageCount, MAX_PAGES_FOR_VISION);

    try {
      // Convert PDF to PNG images
      // -png: output PNG format
      // -r: DPI resolution
      // -f/-l: first/last page
      const outputPrefix = join(tempDir, "page");
      await execAsync(
        `pdftoppm -png -r ${IMAGE_DPI} -f 1 -l ${pagesToConvert} "${pdfPath}" "${outputPrefix}"`,
        { maxBuffer: 50 * 1024 * 1024 } // 50MB buffer for images
      );

      // Read generated images
      const files = await readdir(tempDir);
      const imageFiles = files
        .filter((f) => f.startsWith("page") && f.endsWith(".png"))
        .sort(); // Ensure correct page order

      for (const imageFile of imageFiles) {
        const imagePath = join(tempDir, imageFile);
        const imageBuffer = await readFile(imagePath);
        const dataUrl = `data:image/png;base64,${imageBuffer.toString("base64")}`;
        images.push(dataUrl);
      }

      logger.info("PDF converted to images", {
        pageCount: images.length,
        dpi: IMAGE_DPI,
      });

      return images;
    } catch (error) {
      logger.error("Failed to convert PDF to images", {
        error: error instanceof Error ? error.message : "Unknown",
      });
      return [];
    }
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(tempDir: string): Promise<void> {
    try {
      const files = await readdir(tempDir);
      await Promise.all(files.map((f) => unlink(join(tempDir, f))));
      await unlink(tempDir).catch(() => {
        // Directory removal might fail, that's ok
      });
    } catch {
      // Ignore cleanup errors
    }
  }
}

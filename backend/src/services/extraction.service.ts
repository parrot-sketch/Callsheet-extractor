/**
 * Contact Extraction Service
 * 
 * High-level service that orchestrates document processing, AI extraction,
 * and data normalization. Uses modular pipeline for clean separation of concerns.
 */

import { logger } from "../utils/logger.js";
import { documentProcessor } from "./document/index.js";
import { extractFromText, extractFromImages } from "./ai/index.js";
import { normalizationService, type NormalizationResult } from "./normalization/index.js";
import type { ExtractionResult } from "../types/index.js";

export interface ExtractContactsResult {
  /** Raw extraction result from AI */
  raw: ExtractionResult;
  /** Normalized/cleaned extraction result */
  normalized: ExtractionResult;
  /** Normalization statistics */
  stats: NormalizationResult["stats"];
  /** Any issues found during normalization */
  issues: NormalizationResult["issues"];
}

/**
 * Extract contacts from any supported document type.
 * 
 * This is the main entry point for contact extraction.
 * Pipeline:
 * 1. Document Processing (PDF, Word, Excel, Image, Text)
 * 2. AI Extraction (Text or Vision based)
 * 3. Data Normalization (phones, names, roles, deduplication)
 */
export async function extractContacts(
  documentContent: string,
  documentType?: string | null,
  filename: string = "document",
): Promise<ExtractContactsResult> {
  try {
    logger.info("Starting contact extraction", {
      documentType,
      filename,
      contentLength: documentContent.length,
    });

    // Step 1: Process the document
    const processorResult = await documentProcessor.process(
      documentContent,
      filename,
      documentType ?? undefined,
    );

    if (!processorResult.success || !processorResult.document) {
      throw new Error(processorResult.error || "Document processing failed");
    }

    const { document } = processorResult;

    // Step 2: Route to appropriate AI extraction method
    let rawExtraction: ExtractionResult;

    if (document.requiresVision && document.images?.length) {
      // Vision-based extraction for images and scanned PDFs
      logger.info("Using vision-based extraction", {
        imageCount: document.images.length,
        strategy: document.strategy,
      });

      rawExtraction = await extractFromImages(document.images);
    } else if (document.textContent) {
      // Text-based extraction for PDFs with text and plain text
      logger.info("Using text-based extraction", {
        textLength: document.textContent.length,
        strategy: document.strategy,
      });

      rawExtraction = await extractFromText(document.textContent);
    } else {
      throw new Error("Document has no extractable content");
    }

    // Step 3: Normalize the extracted data
    logger.info("Normalizing extracted data");
    const normalizationResult = normalizationService.normalize(rawExtraction);

    // Log extraction summary
    logger.info("Extraction and normalization completed", {
      filename,
      documentType: document.type,
      strategy: document.strategy,
      rawContactsCount: rawExtraction.contacts.length,
      normalizedContactsCount: normalizationResult.data.contacts.length,
      duplicatesRemoved: normalizationResult.stats.duplicatesRemoved,
      issuesCount: normalizationResult.issues.length,
    });

    return {
      raw: rawExtraction,
      normalized: normalizationResult.data,
      stats: normalizationResult.stats,
      issues: normalizationResult.issues,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown extraction error";
    logger.error("Contact extraction failed", { error: message, filename, documentType });
    throw new Error(`Extraction failed: ${message}`);
  }
}

/**
 * Legacy function for backward compatibility.
 * Returns only the normalized extraction result.
 */
export async function extractContactsSimple(
  documentContent: string,
  documentType?: string | null,
  filename: string = "document",
): Promise<ExtractionResult> {
  const result = await extractContacts(documentContent, documentType, filename);
  return result.normalized;
}

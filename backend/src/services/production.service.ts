import { ProductionRepository } from "../repositories/production.repository.js";
import { UploadRepository } from "../repositories/upload.repository.js";
import { ContactRepository } from "../repositories/contact.repository.js";
import { extractContacts, type ExtractContactsResult } from "./extraction.service.js";
import { logger } from "../utils/logger.js";
import type { ExtractionResult, Production, ProductionDetail } from "../types/index.js";
import type { NormalizationStats, NormalizationIssue } from "./normalization/types.js";

export interface ProcessUploadResult {
  production_id: string;
  upload_id: string;
  contacts_created: number;
  /** Normalized extraction result (cleaned data) */
  extraction_result: ExtractionResult;
  /** Raw extraction result before normalization */
  raw_extraction?: ExtractionResult;
  /** Normalization statistics */
  normalization_stats: NormalizationStats;
  /** Any issues found during normalization */
  normalization_issues: NormalizationIssue[];
}

export class ProductionService {
  constructor(
    private productionRepo: ProductionRepository,
    private uploadRepo: UploadRepository,
    private contactRepo: ContactRepository,
  ) {}

  /**
   * Process a callsheet upload: create production, extract contacts, normalize, persist.
   */
  async processUpload(
    productionName: string,
    filename: string,
    documentContent: string,
    documentType?: string | null,
  ): Promise<ProcessUploadResult> {
    // Find or create production
    const production = await this.productionRepo.findOrCreate(productionName);

    // Create upload record
    const upload = await this.uploadRepo.create(production.id, filename);
    const uploadId = upload.id;

    try {
      // Run extraction with normalization
      const extractionResult = await extractContacts(documentContent, documentType, filename);

      // Use normalized data for persistence
      const normalizedData = extractionResult.normalized;

      // Persist contacts (using normalized data)
      const contactRows = normalizedData.contacts.map((contact) => ({
        production_id: production.id,
        name: contact.name,
        role: contact.role,
        department_raw: contact.department,
        email: contact.email,
        phone: contact.phone,
        company: normalizedData.production_info.production_company,
        location: null,
        call_time: null,
        wrap_time: null,
        source_file: filename,
      }));

      await this.contactRepo.createMany(contactRows);

      // Update upload status
      await this.uploadRepo.updateStatus(uploadId, "completed", contactRows.length);

      logger.info("Upload processed successfully", {
        productionId: production.id,
        uploadId,
        contactsCount: contactRows.length,
        duplicatesRemoved: extractionResult.stats.duplicatesRemoved,
        issuesCount: extractionResult.issues.length,
      });

      return {
        production_id: production.id,
        upload_id: uploadId,
        contacts_created: contactRows.length,
        extraction_result: normalizedData,
        raw_extraction: extractionResult.raw,
        normalization_stats: extractionResult.stats,
        normalization_issues: extractionResult.issues,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error during extraction";
      logger.error("Upload processing failed", { uploadId, error: message });

      // Update upload status to failed
      await this.uploadRepo.updateStatus(uploadId, "failed", undefined, message);

      throw error;
    }
  }

  /**
   * List productions.
   */
  async listProductions(search?: string, limit = 20): Promise<{ items: Production[]; total: number }> {
    return this.productionRepo.list(search, limit);
  }

  /**
   * Get production detail.
   */
  async getProductionDetail(productionId: string): Promise<ProductionDetail | null> {
    return this.productionRepo.getDetail(productionId);
  }
}

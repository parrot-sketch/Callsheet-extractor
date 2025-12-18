/**
 * Upload Repository - Uses local PostgreSQL.
 */
import { query } from "../database/postgres-client.js";
import { logger } from "../utils/logger.js";
import type { Upload } from "../types/index.js";

export class UploadRepository {
  /**
   * Create upload record.
   */
  async create(productionId: string, filename: string): Promise<Upload> {
    const result = await query<Upload>(
      `INSERT INTO uploads (production_id, filename, status, processing_started_at) 
       VALUES ($1, $2, 'processing', NOW()) 
       RETURNING id, production_id, filename, status, contacts_extracted, error_message, created_at`,
      [productionId, filename]
    );

    if (result.rows.length === 0) {
      logger.error("Failed to create upload", { productionId, filename });
      throw new Error("Failed to create upload");
    }

    return result.rows[0];
  }

  /**
   * Update upload status.
   */
  async updateStatus(
    uploadId: string,
    status: "processing" | "completed" | "failed",
    contactsExtracted?: number,
    errorMessage?: string,
  ): Promise<void> {
    const updates: string[] = ["status = $2"];
    const params: (string | number | null)[] = [uploadId, status];
    let paramIndex = 3;

    if (status === "completed" || status === "failed") {
      updates.push(`processing_completed_at = NOW()`);
    }

    if (contactsExtracted !== undefined) {
      updates.push(`contacts_extracted = $${paramIndex}`);
      params.push(contactsExtracted);
      paramIndex++;
    }

    if (errorMessage) {
      updates.push(`error_message = $${paramIndex}`);
      params.push(errorMessage);
      paramIndex++;
    }

    const sql = `UPDATE uploads SET ${updates.join(", ")} WHERE id = $1`;
    
    try {
      await query(sql, params);
    } catch (error) {
      logger.error("Failed to update upload status", { error, uploadId, status });
      throw new Error(`Failed to update upload status: ${(error as Error).message}`);
    }
  }

  /**
   * Store extraction result JSON.
   */
  async storeExtractionResult(uploadId: string, extractionResult: object): Promise<void> {
    try {
      await query(
        `UPDATE uploads SET extraction_result = $2 WHERE id = $1`,
        [uploadId, JSON.stringify(extractionResult)]
      );
    } catch (error) {
      logger.error("Failed to store extraction result", { error, uploadId });
      throw new Error(`Failed to store extraction result: ${(error as Error).message}`);
    }
  }
}

/**
 * Contact Repository - Uses local PostgreSQL.
 */
import { query } from "../database/postgres-client.js";
import { logger } from "../utils/logger.js";
import type { Contact } from "../types/index.js";

export class ContactRepository {
  /**
   * Create multiple contacts.
   */
  async createMany(contacts: Array<Omit<Contact, "id" | "created_at">>): Promise<void> {
    if (contacts.length === 0) {
      return;
    }

    // Build bulk insert query
    const values: string[] = [];
    const params: (string | null)[] = [];
    let paramIndex = 1;

    for (const contact of contacts) {
      values.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      params.push(
        contact.production_id,
        contact.upload_id ?? null,
        contact.name,
        contact.email ?? null,
        contact.phone ?? null,
        contact.role ?? null,
        contact.department_raw ?? null
      );
    }

    const sql = `
      INSERT INTO contacts (production_id, upload_id, name, email, phone, role, department_raw) 
      VALUES ${values.join(", ")}
    `;

    try {
      await query(sql, params);
    } catch (error) {
      logger.error("Failed to create contacts", { error, count: contacts.length });
      throw new Error(`Failed to create contacts: ${(error as Error).message}`);
    }
  }

  /**
   * Get contacts by production ID.
   */
  async getByProductionId(productionId: string): Promise<Contact[]> {
    const result = await query<Contact>(
      `SELECT * FROM contacts 
       WHERE production_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at DESC`,
      [productionId]
    );

    return result.rows;
  }

  /**
   * Get contacts by upload ID.
   */
  async getByUploadId(uploadId: string): Promise<Contact[]> {
    const result = await query<Contact>(
      `SELECT * FROM contacts WHERE upload_id = $1 ORDER BY created_at DESC`,
      [uploadId]
    );

    return result.rows;
  }
}

/**
 * Production Repository - Uses local PostgreSQL.
 */
import { query } from "../database/postgres-client.js";
import { logger } from "../utils/logger.js";
import type { Production, ProductionDetail } from "../types/index.js";

export class ProductionRepository {
  /**
   * Create a new production.
   */
  async create(name: string, description?: string): Promise<Production> {
    const result = await query<Production>(
      `INSERT INTO productions (name, description) 
       VALUES ($1, $2) 
       RETURNING id, name, description, created_at, updated_at`,
      [name, description ?? null]
    );

    if (result.rows.length === 0) {
      logger.error("Failed to create production", { name });
      throw new Error("Failed to create production");
    }

    return result.rows[0];
  }

  /**
   * Find production by ID.
   */
  async findById(id: string): Promise<Production | null> {
    const result = await query<Production>(
      `SELECT id, name, description, created_at, updated_at 
       FROM productions 
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    return result.rows[0] ?? null;
  }

  /**
   * Find or create production by name.
   */
  async findOrCreate(name: string, description?: string): Promise<Production> {
    // Try to find existing
    const existing = await query<Production>(
      `SELECT id, name, description, created_at, updated_at 
       FROM productions 
       WHERE name = $1 AND deleted_at IS NULL`,
      [name]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Create new
    return this.create(name, description);
  }

  /**
   * List productions with optional search.
   */
  async list(search?: string, limit = 20): Promise<{ items: Production[]; total: number }> {
    const safeLimit = Math.min(limit, 100);

    let countQuery: string;
    let dataQuery: string;
    let params: (string | number)[];

    if (search) {
      countQuery = `SELECT COUNT(*) FROM productions WHERE name ILIKE $1 AND deleted_at IS NULL`;
      dataQuery = `
        SELECT id, name, description, created_at, updated_at 
        FROM productions 
        WHERE name ILIKE $1 AND deleted_at IS NULL 
        ORDER BY created_at DESC 
        LIMIT $2`;
      params = [`%${search}%`, safeLimit];
    } else {
      countQuery = `SELECT COUNT(*) FROM productions WHERE deleted_at IS NULL`;
      dataQuery = `
        SELECT id, name, description, created_at, updated_at 
        FROM productions 
        WHERE deleted_at IS NULL 
        ORDER BY created_at DESC 
        LIMIT $1`;
      params = [safeLimit];
    }

    try {
      const countResult = await query<{ count: string }>(
        countQuery,
        search ? [`%${search}%`] : []
      );
      const dataResult = await query<Production>(dataQuery, params);

      return {
        items: dataResult.rows,
        total: parseInt(countResult.rows[0]?.count ?? "0", 10),
      };
    } catch (error) {
      logger.error("Failed to list productions", { error, search });
      throw new Error(`Failed to list productions: ${(error as Error).message}`);
    }
  }

  /**
   * Get production detail with uploads and contacts.
   */
  async getDetail(productionId: string): Promise<ProductionDetail | null> {
    const production = await this.findById(productionId);
    if (!production) {
      return null;
    }

    // Get uploads
    const uploadsResult = await query(
      `SELECT id, filename, status, contacts_extracted, error_message, created_at 
       FROM uploads 
       WHERE production_id = $1 
       ORDER BY created_at DESC`,
      [productionId]
    );

    // Get contacts
    const contactsResult = await query(
      `SELECT * FROM contacts 
       WHERE production_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at DESC`,
      [productionId]
    );

    return {
      production,
      uploads: uploadsResult.rows,
      contacts: contactsResult.rows,
    };
  }
}

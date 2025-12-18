/**
 * Direct PostgreSQL client for local development.
 * Uses the pg library for direct database connections.
 */
import pg from "pg";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

let pool: pg.Pool | null = null;

/**
 * Get or create the PostgreSQL connection pool.
 */
export function getPool(): pg.Pool {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured");
    }

    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on("error", (err) => {
      logger.error("Unexpected error on idle client", err);
    });
  }

  return pool;
}

/**
 * Execute a query against the database.
 */
export async function query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await getPool().query<T>(text, params);
  const duration = Date.now() - start;

  if (duration > 100) {
    logger.warn("Slow query", { text: text.substring(0, 100), duration, rows: result.rowCount });
  }

  return result;
}

/**
 * Test the database connection.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query("SELECT NOW() as now, current_database() as db");
    logger.info("✅ PostgreSQL connection established", {
      database: result.rows[0].db,
      serverTime: result.rows[0].now,
    });
    return true;
  } catch (error) {
    logger.error("❌ PostgreSQL connection failed", { error });
    return false;
  }
}

/**
 * Close the connection pool.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info("PostgreSQL pool closed");
  }
}


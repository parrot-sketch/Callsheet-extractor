/**
 * Normalization Types
 * 
 * Types for the data normalization pipeline.
 */

import type { ExtractionResult } from "../../types/index.js";

export interface NormalizationConfig {
  /** Normalize phone numbers to E.164 format */
  normalizePhones: boolean;
  /** Normalize names to Title Case */
  normalizeNames: boolean;
  /** Standardize role names */
  normalizeRoles: boolean;
  /** Infer department from role if missing */
  inferDepartments: boolean;
  /** Remove duplicate contacts */
  deduplicate: boolean;
  /** Default country code for phone normalization */
  defaultCountryCode: string;
}

export const DEFAULT_CONFIG: NormalizationConfig = {
  normalizePhones: true,
  normalizeNames: true,
  normalizeRoles: true,
  inferDepartments: true,
  deduplicate: true,
  defaultCountryCode: "1", // US
};

export interface NormalizationResult {
  /** Normalized extraction result */
  data: ExtractionResult;
  /** Statistics about changes made */
  stats: NormalizationStats;
  /** Any issues found during normalization */
  issues: NormalizationIssue[];
}

export interface NormalizationStats {
  phonesNormalized: number;
  namesNormalized: number;
  rolesNormalized: number;
  departmentsInferred: number;
  duplicatesRemoved: number;
  totalContacts: number;
}

export interface NormalizationIssue {
  type: "warning" | "error";
  field: string;
  contactName?: string;
  message: string;
}


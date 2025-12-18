/**
 * Data Normalization Service
 * 
 * Post-extraction pipeline that normalizes and cleans extracted data.
 * Ensures consistent formatting across all callsheet extractions.
 */

import { logger } from "../../utils/logger.js";
import { PhoneNormalizer } from "./normalizers/phone.normalizer.js";
import { NameNormalizer } from "./normalizers/name.normalizer.js";
import { RoleNormalizer } from "./normalizers/role.normalizer.js";
import { Deduplicator } from "./normalizers/deduplicator.js";
import type { ExtractionResult } from "../../types/index.js";
import type { NormalizationConfig, NormalizationResult, NormalizationStats, NormalizationIssue } from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";

// Re-export types
export * from "./types.js";

export class NormalizationService {
  private phoneNormalizer: PhoneNormalizer;
  private nameNormalizer: NameNormalizer;
  private roleNormalizer: RoleNormalizer;
  private deduplicator: Deduplicator;
  private config: NormalizationConfig;

  constructor(config: Partial<NormalizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.phoneNormalizer = new PhoneNormalizer(this.config.defaultCountryCode);
    this.nameNormalizer = new NameNormalizer();
    this.roleNormalizer = new RoleNormalizer();
    this.deduplicator = new Deduplicator();
  }

  /**
   * Normalize extraction results.
   */
  normalize(extraction: ExtractionResult): NormalizationResult {
    logger.info("Starting data normalization", {
      contactCount: extraction.contacts.length,
    });

    const stats: NormalizationStats = {
      phonesNormalized: 0,
      namesNormalized: 0,
      rolesNormalized: 0,
      departmentsInferred: 0,
      duplicatesRemoved: 0,
      totalContacts: extraction.contacts.length,
    };

    const issues: NormalizationIssue[] = [];

    // Clone the extraction to avoid mutation
    const result: ExtractionResult = JSON.parse(JSON.stringify(extraction));

    // Normalize contacts
    result.contacts = result.contacts.map((contact) => {
      const originalName = contact.name;

      // Normalize name
      if (this.config.normalizeNames) {
        const normalizedName = this.nameNormalizer.normalize(contact.name);
        if (normalizedName && normalizedName !== contact.name) {
          contact.name = normalizedName;
          stats.namesNormalized++;
        }

        // Validate name
        if (!this.nameNormalizer.isValid(contact.name)) {
          issues.push({
            type: "warning",
            field: "name",
            contactName: originalName,
            message: `Invalid or incomplete name: "${contact.name}"`,
          });
        }
      }

      // Normalize phone
      if (this.config.normalizePhones && contact.phone) {
        const normalizedPhone = this.phoneNormalizer.normalize(contact.phone);
        if (normalizedPhone !== contact.phone) {
          contact.phone = normalizedPhone;
          stats.phonesNormalized++;
        }

        // Validate phone
        if (contact.phone && !this.phoneNormalizer.isValid(contact.phone)) {
          issues.push({
            type: "warning",
            field: "phone",
            contactName: contact.name,
            message: `Invalid phone number: "${contact.phone}"`,
          });
        }
      }

      // Normalize role
      if (this.config.normalizeRoles && contact.role) {
        const normalizedRole = this.roleNormalizer.normalizeRole(contact.role);
        if (normalizedRole && normalizedRole !== contact.role) {
          contact.role = normalizedRole;
          stats.rolesNormalized++;
        }
      }

      // Infer department
      if (this.config.inferDepartments) {
        const inferredDepartment = this.roleNormalizer.inferDepartment(
          contact.role,
          contact.department
        );
        if (inferredDepartment && !contact.department) {
          contact.department = inferredDepartment;
          stats.departmentsInferred++;
        }
      }

      // Normalize email to lowercase
      if (contact.email) {
        contact.email = contact.email.toLowerCase().trim();

        // Validate email format
        if (!this.isValidEmail(contact.email)) {
          issues.push({
            type: "warning",
            field: "email",
            contactName: contact.name,
            message: `Invalid email format: "${contact.email}"`,
          });
        }
      }

      // Log low confidence
      // @ts-ignore - confidence property exists in Zod schema but might be missing in strict type definition iteration depending on how TS infers it
      if (typeof contact.confidence === 'number' && contact.confidence < 0.85) {
        logger.warn("Low confidence extraction", {
          name: contact.name,
          confidence: contact.confidence,
          file: "normalization",
        });
      }

      return contact;
    });

    // Deduplicate contacts
    if (this.config.deduplicate) {
      const deduped = this.deduplicator.deduplicate(result.contacts);
      result.contacts = deduped.contacts;
      stats.duplicatesRemoved = deduped.removedCount;
    }

    // Normalize emergency contacts
    result.emergency_contacts = result.emergency_contacts.map((ec) => {
      if (this.config.normalizePhones && ec.phone) {
        ec.phone = this.phoneNormalizer.normalize(ec.phone);
      }
      return ec;
    });

    // Normalize locations
    result.locations = result.locations.map((loc) => {
      if (this.config.normalizePhones && loc.phone) {
        loc.phone = this.phoneNormalizer.normalize(loc.phone);
      }
      return loc;
    });

    // Update total after deduplication
    stats.totalContacts = result.contacts.length;

    logger.info("Normalization complete", { stats });

    return {
      data: result,
      stats,
      issues,
    };
  }

  /**
   * Basic email validation.
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// Export singleton for convenience
export const normalizationService = new NormalizationService();



import { z } from "zod";

// --- Sub-Schemas ---

const ProductionInfoSchema = z.object({
  title: z
    .string()
    .nullable()
    .describe("The official title of the production or show."),
  production_company: z
    .string()
    .nullable()
    .describe("The name of the production company."),
  shoot_date: z
    .string()
    .nullable()
    .describe("The date of the shoot in YYYY-MM-DD format if clearly visible, otherwise null."),
});

const ContactSchema = z.object({
  name: z
    .string()
    .describe("Full name of the person. Capitalize properly (Title Case)."),
  role: z
    .string()
    .nullable()
    .describe("Job title or role (e.g., 'Director', 'Gaffer')."),
  department: z
    .string()
    .nullable()
    .describe("Department the person belongs to (e.g., 'Camera', 'Electric')."),
  phone: z
    .string()
    .nullable()
    .describe("Primary phone number. Include country code if visible."),
  email: z
    .string()
    .nullable()
    .describe("Email address."),
  notes: z
    .string()
    .nullable()
    .describe("Any additional info or secondary phone numbers."),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score (0.0 to 1.0) for this specific contact extraction."),
});

const EmergencyContactSchema = z.object({
  type: z
    .string()
    .describe("Type of service (e.g., 'Hospital', 'Police', 'Medic')."),
  name: z
    .string()
    .nullable()
    .describe("Name of the facility or person."),
  phone: z
    .string()
    .nullable()
    .describe("Emergency phone number."),
});

const LocationSchema = z.object({
  name: z
    .string()
    .nullable()
    .describe("Name of the location."),
  address: z
    .string()
    .nullable()
    .describe("Full address of the location."),
  phone: z
    .string()
    .nullable()
    .describe("Contact phone number for the location."),
});

// --- Main Schema ---

export const ExtractionResultSchema = z.object({
  production_info: ProductionInfoSchema,
  contacts: z.array(ContactSchema).describe("List of all crew and cast members found."),
  emergency_contacts: z.array(EmergencyContactSchema).describe("List of emergency services."),
  locations: z.array(LocationSchema).describe("List of filming locations."),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// --- Validation Logic ---

export interface ValidationIssues {
  field: string;
  message: string;
  severity: "warning" | "error";
}

export function validateExtraction(data: ExtractionResult): ValidationIssues[] {
  const issues: ValidationIssues[] = [];

  // Check for critical missing data
  if (data.contacts.length === 0) {
    issues.push({
      field: "contacts",
      message: "No contacts were extracted. This might be a parsing error.",
      severity: "warning",
    });
  }

  return issues;
}

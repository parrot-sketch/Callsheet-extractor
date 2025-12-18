/**
 * Export Types
 */

export interface ExportableContact {
  name: string;
  role?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
}

export type ExportFormat = "csv" | "vcf" | "json" | "txt";

export interface ExportOption {
  id: ExportFormat;
  label: string;
  extension: string;
  mimeType: string;
}

export const EXPORT_OPTIONS: ExportOption[] = [
  { id: "csv", label: "CSV (Spreadsheet)", extension: "csv", mimeType: "text/csv" },
  { id: "vcf", label: "vCard (Contacts)", extension: "vcf", mimeType: "text/vcard" },
  { id: "json", label: "JSON", extension: "json", mimeType: "application/json" },
  { id: "txt", label: "Plain Text", extension: "txt", mimeType: "text/plain" },
];


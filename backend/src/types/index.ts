// Extraction types
// Extraction types
// Re-export validation types as the source of truth
export { ExtractionResultSchema } from "../services/ai/validator.js";
export type { ExtractionResult } from "../services/ai/validator.js";

// Database types
export interface Production {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Upload {
  id: string;
  production_id: string;
  filename: string;
  status: "processing" | "completed" | "failed";
  contacts_extracted: number | null;
  error_message: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  production_id: string | null;
  upload_id: string | null;
  name: string;
  role: string | null;
  department: string | null;
  department_raw: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  location: string | null;
  call_time: string | null;
  wrap_time: string | null;
  source_file: string | null;
  created_at: string;
  // Transients/Extraction only
  confidence?: number;
}

export interface ProductionDetail {
  production: Production;
  uploads: Upload[];
  contacts: Contact[];
}


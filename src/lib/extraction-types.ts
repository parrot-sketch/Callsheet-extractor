// Shared domain types for callsheet extraction.
// These mirror the JSON contract returned by the backend extraction service
// so the frontend can work in a strongly-typed way.

export type Contact = {
  name: string;
  role: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type EmergencyContact = {
  type: string;
  name: string | null;
  phone: string | null;
};

export type Location = {
  name: string | null;
  address: string | null;
  phone: string | null;
};

export type ProductionInfo = {
  title: string | null;
  production_company: string | null;
  shoot_date: string | null;
};

export type ExtractionResult = {
  production_info: ProductionInfo;
  contacts: Contact[];
  emergency_contacts: EmergencyContact[];
  locations: Location[];
};

export type DocumentType = "pdf" | "image" | "text";

export type ExtractionRequest = {
  // The raw document content that will ultimately be sent to the backend.
  // For images this may be a data URL; for text-only flows it will be plain text.
  documentContent: string;
  documentType?: DocumentType;
};




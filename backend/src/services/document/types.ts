/**
 * Document Processing Types
 * 
 * Defines the core types for the document processing pipeline.
 */

export type DocumentType = "pdf" | "image" | "text" | "unknown";

export interface DocumentMetadata {
  originalFilename: string;
  mimeType: string;
  size: number;
  pageCount?: number;
}

export interface ProcessedDocument {
  /** The document type that was detected/processed */
  type: DocumentType;
  
  /** Extracted text content (for PDFs and text documents) */
  textContent?: string;
  
  /** Image data URLs for vision processing (for images and scanned PDFs) */
  images?: string[];
  
  /** Document metadata */
  metadata: DocumentMetadata;
  
  /** Processing strategy that was used */
  strategy: "text-extraction" | "vision" | "direct-text";
  
  /** Whether the document requires vision processing */
  requiresVision: boolean;
}

export interface ProcessorResult {
  success: boolean;
  document?: ProcessedDocument;
  error?: string;
}

export interface DocumentProcessor {
  /** Check if this processor can handle the document */
  canProcess(dataUrl: string, mimeType?: string): boolean;
  
  /** Process the document and return extracted content */
  process(dataUrl: string, filename: string): Promise<ProcessorResult>;
}


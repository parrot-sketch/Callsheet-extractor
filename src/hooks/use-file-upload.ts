import { useState, useCallback } from "react";
import { processUpload, type ProcessUploadResponse } from "@/lib/api";
import { fileToDataUrl } from "@/lib/file-utils";
import type { DocumentType, ExtractionResult } from "@/lib/extraction-types";

type UploadStatus = "idle" | "processing" | "success" | "error";

interface UseFileUploadOptions {
  onSuccess?: (result: ProcessUploadResponse) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for handling file uploads and extraction.
 * Manages file state, upload process, and results.
 */
export function useFileUpload(options?: UseFileUploadOptions) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    setError(null);

    if (!file) {
      setDocumentType(null);
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".pdf")) {
      setDocumentType("pdf");
    } else if (lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".gif") || lowerName.endsWith(".webp")) {
      setDocumentType("image");
    } else if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
      setDocumentType("text"); // Word docs are processed to text
    } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      setDocumentType("text"); // Excel files are processed to text
    } else {
      setDocumentType("text");
    }
  }, []);

  const upload = useCallback(
    async (productionName: string, documentContent?: string) => {
      if (!productionName.trim()) {
        const err = "Production name is required";
        setError(err);
        options?.onError?.(err);
        return;
      }

      setStatus("processing");
      setError(null);

      try {
        let finalContent: string;
        let finalType: string | null = documentType ?? null;

        if (documentContent) {
          // Use provided text content
          finalContent = documentContent;
          finalType = "text";
        } else if (selectedFile) {
          // Convert file to data URL
          const { dataUrl, type } = await fileToDataUrl(selectedFile);
          finalContent = dataUrl;
          finalType = type;
        } else {
          throw new Error("No file or content provided");
        }

        const response = await processUpload({
          productionName: productionName.trim(),
          filename: selectedFile?.name ?? "pasted-text.txt",
          documentContent: finalContent,
          documentType: finalType,
        });

        setResult(response.extraction_result);
        setStatus("success");
        options?.onSuccess?.(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        setStatus("error");
        options?.onError?.(message);
      }
    },
    [selectedFile, documentType, options],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setDocumentType(null);
  }, []);

  return {
    status,
    result,
    error,
    selectedFile,
    documentType,
    handleFileSelect,
    upload,
    reset,
    isProcessing: status === "processing",
  };
}


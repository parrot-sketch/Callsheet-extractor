/**
 * File Utilities
 * 
 * Handles file conversion to data URLs for upload.
 * Supports PDF, Word, Excel, images, and text files.
 */

export type FileType = "pdf" | "word" | "excel" | "image" | "text";

export interface FileDataUrl {
  dataUrl: string;
  type: FileType;
}

/**
 * Convert a File to a base64 data URL for upload.
 */
export async function fileToDataUrl(file: File): Promise<FileDataUrl> {
  const lowerName = file.name.toLowerCase();
  const mimeType = file.type;

  // PDF files
  if (lowerName.endsWith(".pdf") || mimeType === "application/pdf") {
    return {
      dataUrl: `data:application/pdf;base64,${await fileToBase64(file)}`,
      type: "pdf",
    };
  }

  // Word documents
  if (
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc") ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const docMime = lowerName.endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/msword";
    return {
      dataUrl: `data:${docMime};base64,${await fileToBase64(file)}`,
      type: "word",
    };
  }

  // Excel spreadsheets
  if (
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".xls") ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    const excelMime = lowerName.endsWith(".xlsx")
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/vnd.ms-excel";
    return {
      dataUrl: `data:${excelMime};base64,${await fileToBase64(file)}`,
      type: "excel",
    };
  }

  // Image files
  if (
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".gif") ||
    lowerName.endsWith(".webp") ||
    mimeType?.startsWith("image/")
  ) {
    const imageMime = mimeType || getImageMimeType(lowerName);
    return {
      dataUrl: `data:${imageMime};base64,${await fileToBase64(file)}`,
      type: "image",
    };
  }

  // Text files and fallback
  const text = await file.text();
  return {
    dataUrl: text,
    type: "text",
  };
}

/**
 * Convert a File to base64 string.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix if present
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get image MIME type from filename.
 */
function getImageMimeType(filename: string): string {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".gif")) return "image/gif";
  if (filename.endsWith(".webp")) return "image/webp";
  return "image/png"; // Default
}

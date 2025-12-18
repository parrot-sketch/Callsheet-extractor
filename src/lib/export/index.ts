/**
 * Contact Export Module
 */

export * from "./types";
export * from "./formatters";

import type { ExportableContact, ExportFormat } from "./types";
import { EXPORT_OPTIONS } from "./types";
import { formatAsCSV, formatAsVCard, formatAsJSON, formatAsText } from "./formatters";

/**
 * Export contacts to a file
 */
export function exportContacts(
  contacts: ExportableContact[],
  format: ExportFormat,
  filename: string = "contacts"
): void {
  const option = EXPORT_OPTIONS.find((o) => o.id === format);
  if (!option) {
    throw new Error(`Unknown export format: ${format}`);
  }

  let content: string;

  switch (format) {
    case "csv":
      content = formatAsCSV(contacts);
      break;
    case "vcf":
      content = formatAsVCard(contacts);
      break;
    case "json":
      content = formatAsJSON(contacts);
      break;
    case "txt":
      content = formatAsText(contacts);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  downloadFile(content, `${filename}.${option.extension}`, option.mimeType);
}

/**
 * Download content as a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Copy contacts to clipboard as text
 */
export function copyContactsToClipboard(contacts: ExportableContact[]): Promise<void> {
  const text = formatAsText(contacts);
  return navigator.clipboard.writeText(text);
}


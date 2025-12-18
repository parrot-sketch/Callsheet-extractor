/**
 * Excel Document Processor
 * 
 * Handles Microsoft Excel documents (.xlsx, .xls) using xlsx library.
 * Converts spreadsheet data to structured text for AI processing.
 */

import * as XLSX from "xlsx";
import { logger } from "../../../utils/logger.js";
import type { DocumentProcessor, ProcessorResult } from "../types.js";

const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 50000;

export class ExcelProcessor implements DocumentProcessor {
  canProcess(dataUrl: string, mimeType?: string): boolean {
    return (
      dataUrl.startsWith("data:application/vnd.openxmlformats-officedocument.spreadsheetml") ||
      dataUrl.startsWith("data:application/vnd.ms-excel") ||
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    );
  }

  async process(dataUrl: string, filename: string): Promise<ProcessorResult> {
    try {
      logger.info("Processing Excel document", { filename });

      // Extract base64 data
      const base64Match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (!base64Match) {
        return {
          success: false,
          error: "Invalid Excel document data URL format",
        };
      }

      const excelBuffer = Buffer.from(base64Match[1], "base64");

      // Read workbook
      const workbook = XLSX.read(excelBuffer, { type: "buffer" });

      if (!workbook.SheetNames.length) {
        return {
          success: false,
          error: "Excel file contains no sheets",
        };
      }

      // Extract text from all sheets
      const textParts: string[] = [];
      
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet to array of arrays
        const data = XLSX.utils.sheet_to_json<string[]>(sheet, { 
          header: 1,
          defval: "",
          blankrows: false,
        });

        if (data.length === 0) continue;

        // Format sheet data as structured text
        const sheetText = this.formatSheetAsText(sheetName, data as string[][]);
        if (sheetText.trim()) {
          textParts.push(sheetText);
        }
      }

      let textContent = textParts.join("\n\n---\n\n");

      // Validate content
      if (textContent.trim().length < MIN_TEXT_LENGTH) {
        return {
          success: false,
          error: `Excel file has insufficient data (${textContent.trim().length} characters). The file may be empty or contain only formatting.`,
        };
      }

      // Truncate if too long
      if (textContent.length > MAX_TEXT_LENGTH) {
        logger.info("Truncating large Excel document", {
          originalLength: textContent.length,
          truncatedLength: MAX_TEXT_LENGTH,
        });
        textContent = textContent.substring(0, MAX_TEXT_LENGTH) + 
          "\n\n[Document truncated - showing first 50,000 characters]";
      }

      logger.info("Excel document processed", {
        filename,
        sheetCount: workbook.SheetNames.length,
        textLength: textContent.length,
      });

      return {
        success: true,
        document: {
          type: "text",
          textContent,
          metadata: {
            originalFilename: filename,
            mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            size: excelBuffer.length,
          },
          strategy: "text-extraction",
          requiresVision: false,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Excel processing error";
      logger.error("Excel document processing failed", { error: message, filename });

      return {
        success: false,
        error: `Excel document processing failed: ${message}`,
      };
    }
  }

  /**
   * Format sheet data as readable text for AI processing.
   * Preserves table structure with clear delimiters.
   */
  private formatSheetAsText(sheetName: string, data: string[][]): string {
    const lines: string[] = [];
    
    lines.push(`=== Sheet: ${sheetName} ===`);
    lines.push("");

    for (const row of data) {
      // Skip completely empty rows
      if (row.every((cell) => !cell || String(cell).trim() === "")) {
        continue;
      }

      // Format row with pipe delimiters (easier for AI to parse)
      const formattedRow = row
        .map((cell) => String(cell || "").trim())
        .join(" | ");
      
      lines.push(formattedRow);
    }

    return lines.join("\n");
  }
}


/**
 * OpenAI Client Module
 * 
 * Enterprise-grade OpenAI integration with:
 * - Structured Outputs (Zod)
 * - Retry logic with exponential backoff
 * - Rate limiting awareness
 * - Structured error handling
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import config from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { ExtractionResultSchema, type ExtractionResult } from "../../types/index.js";
import {
  EXTRACTION_SYSTEM_PROMPT,
  getTextExtractionPrompt,
  getVisionExtractionPrompt,
} from "./prompts.js";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Sleep for a specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract contacts from text content using Structured Outputs.
 */
export async function extractFromText(textContent: string): Promise<ExtractionResult> {
  logger.info("Starting text-based extraction", {
    textLength: textContent.length,
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.parse({
        model: config.OPENAI_MODEL,
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: getTextExtractionPrompt(textContent) },
        ],
        temperature: 0.1,
        response_format: zodResponseFormat(ExtractionResultSchema as any, "extraction_result"),
      });

      const result = response.choices[0]?.message?.parsed;

      if (!result) {
        throw new Error("Empty or invalid response from OpenAI");
      }

      logger.info("Text extraction completed", {
        contactsCount: result.contacts.length,
        emergencyCount: result.emergency_contacts.length,
        locationsCount: result.locations.length,
      });

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const isRetryable =
        lastError.message.includes("rate_limit") ||
        lastError.message.includes("timeout") ||
        lastError.message.includes("500") ||
        lastError.message.includes("503");

      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn(`OpenAI request failed, retrying in ${delay}ms`, {
          attempt,
          error: lastError.message,
        });
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  logger.error("Text extraction failed after retries", {
    error: lastError?.message,
  });

  throw new Error(`Extraction failed: ${lastError?.message || "Unknown error"}`);
}

/**
 * Extract contacts from images using vision API and Structured Outputs.
 */
export async function extractFromImages(imageDataUrls: string[]): Promise<ExtractionResult> {
  logger.info("Starting vision-based extraction", {
    imageCount: imageDataUrls.length,
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Build content array with all images
      const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

      for (const imageUrl of imageDataUrls) {
        content.push({
          type: "image_url",
          image_url: {
            url: imageUrl,
            detail: "high", // Use high detail for better text extraction
          },
        });
      }

      // Add text prompt
      content.push({
        type: "text",
        text: getVisionExtractionPrompt(),
      });

      const response = await openai.chat.completions.parse({
        model: config.OPENAI_MODEL,
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content },
        ],
        temperature: 0.1,
        response_format: zodResponseFormat(ExtractionResultSchema as any, "extraction_result"),
      });

      const result = response.choices[0]?.message?.parsed;

      if (!result) {
        throw new Error("Empty or invalid response from OpenAI Vision");
      }

      logger.info("Vision extraction completed", {
        contactsCount: result.contacts.length,
        emergencyCount: result.emergency_contacts.length,
        locationsCount: result.locations.length,
      });

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const isRetryable =
        lastError.message.includes("rate_limit") ||
        lastError.message.includes("timeout") ||
        lastError.message.includes("500") ||
        lastError.message.includes("503");

      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn(`OpenAI Vision request failed, retrying in ${delay}ms`, {
          attempt,
          error: lastError.message,
        });
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  logger.error("Vision extraction failed after retries", {
    error: lastError?.message,
  });

  throw new Error(`Vision extraction failed: ${lastError?.message || "Unknown error"}`);
}



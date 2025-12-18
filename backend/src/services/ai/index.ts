/**
 * AI Services Module
 * 
 * Centralizes all AI-related functionality.
 */

export { extractFromText, extractFromImages } from "./openai.client.js";
export { EXTRACTION_SYSTEM_PROMPT, getTextExtractionPrompt, getVisionExtractionPrompt } from "./prompts.js";


/**
 * AI Prompts Module
 * 
 * Centralized management of AI prompts for callsheet extraction.
 * Separating prompts allows for easy testing, versioning, and A/B testing.
 */

export const EXTRACTION_SYSTEM_PROMPT = `You are an expert at extracting contact information from production callsheets.

Your task is to extract ALL contact information including:
- Crew members (all departments)
- Cast members
- Production staff
- Emergency contacts (hospitals, police, fire)
- Locations with contact details

IMPORTANT RULES:
1. Extract EVERY person mentioned with a phone number or email
2. Include partial information (name without phone is still valuable)
3. Normalize phone numbers to a consistent format
4. Deduplicate contacts with identical name AND phone
5. Capitalize names properly (Title Case)
6. Clean up extra whitespace
7. For multiple phone numbers, put primary in "phone" field, others in "notes"
8. Assign a confidence score (0.0-1.0) to each contact based on clarity and completeness.

IGNORE:
- Schedule information (call times, wrap times) unless they have contact details
- Scene descriptions
- Weather information
- Equipment lists
- Map directions`;

export const EXTRACTION_USER_PROMPT_TEXT = `Extract all contact information from this callsheet:

{content}`;

export const EXTRACTION_USER_PROMPT_VISION = `Extract all contact information from this callsheet image. Look carefully at all text, tables, and contact lists visible in the image.`;

/**
 * Generate the user prompt for text-based extraction.
 */
export function getTextExtractionPrompt(content: string): string {
  return EXTRACTION_USER_PROMPT_TEXT.replace("{content}", content);
}

/**
 * Generate the user prompt for vision-based extraction.
 */
export function getVisionExtractionPrompt(): string {
  return EXTRACTION_USER_PROMPT_VISION;
}


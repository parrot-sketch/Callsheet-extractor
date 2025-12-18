/**
 * Phone Number Normalizer
 * 
 * Normalizes phone numbers to a consistent format.
 * Handles various input formats and standardizes output.
 */

export class PhoneNormalizer {
  private defaultCountryCode: string;

  constructor(defaultCountryCode: string = "1") {
    this.defaultCountryCode = defaultCountryCode;
  }

  /**
   * Normalize a phone number to a consistent format.
   * Returns format: +1 (XXX) XXX-XXXX for US numbers
   */
  normalize(phone: string | null): string | null {
    if (!phone) return null;

    // Remove all non-digit characters except + at the start
    let digits = phone.replace(/[^\d+]/g, "");
    
    // Handle + at the start
    const hasPlus = digits.startsWith("+");
    digits = digits.replace(/\D/g, "");

    if (digits.length === 0) return null;

    // Handle different lengths
    if (digits.length === 10) {
      // US number without country code: XXX-XXX-XXXX
      return this.formatUS(digits);
    }
    
    if (digits.length === 11 && digits.startsWith("1")) {
      // US number with country code: 1-XXX-XXX-XXXX
      return this.formatUS(digits.substring(1));
    }

    if (digits.length > 11) {
      // International number - keep as-is with formatting
      return `+${digits}`;
    }

    if (digits.length === 7) {
      // Local number without area code
      return `${digits.substring(0, 3)}-${digits.substring(3)}`;
    }

    // Return cleaned digits if we can't determine format
    return digits;
  }

  /**
   * Format a 10-digit US phone number.
   */
  private formatUS(digits: string): string {
    const areaCode = digits.substring(0, 3);
    const exchange = digits.substring(3, 6);
    const subscriber = digits.substring(6, 10);
    return `(${areaCode}) ${exchange}-${subscriber}`;
  }

  /**
   * Check if a phone number is valid.
   */
  isValid(phone: string | null): boolean {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }
}


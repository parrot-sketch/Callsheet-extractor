/**
 * Name Normalizer
 * 
 * Normalizes names to proper Title Case with special handling
 * for common patterns (Mc, Mac, O', etc.).
 */

export class NameNormalizer {
  // Words that should remain lowercase (unless at start)
  private readonly lowercaseWords = new Set([
    "de", "del", "della", "di", "da", "van", "von", "der", "den", "la", "le", "du"
  ]);

  // Prefixes that need special handling
  private readonly specialPrefixes = ["mc", "mac", "o'"];

  /**
   * Normalize a name to proper Title Case.
   */
  normalize(name: string | null): string | null {
    if (!name) return null;

    // Trim and collapse multiple spaces
    let normalized = name.trim().replace(/\s+/g, " ");

    if (normalized.length === 0) return null;

    // Split into words
    const words = normalized.split(" ");
    
    const normalizedWords = words.map((word, index) => {
      // Skip empty words
      if (!word) return word;

      const lowerWord = word.toLowerCase();

      // Check for special prefixes (Mc, Mac, O')
      for (const prefix of this.specialPrefixes) {
        if (lowerWord.startsWith(prefix) && lowerWord.length > prefix.length) {
          const rest = word.substring(prefix.length);
          if (prefix === "o'") {
            return "O'" + this.capitalize(rest);
          }
          return this.capitalize(prefix) + this.capitalize(rest);
        }
      }

      // Check for lowercase words (not at start)
      if (index > 0 && this.lowercaseWords.has(lowerWord)) {
        return lowerWord;
      }

      // Handle hyphenated names
      if (word.includes("-")) {
        return word.split("-").map(part => this.capitalize(part)).join("-");
      }

      // Standard capitalization
      return this.capitalize(word);
    });

    return normalizedWords.join(" ");
  }

  /**
   * Capitalize first letter, lowercase rest.
   */
  private capitalize(word: string): string {
    if (!word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  /**
   * Check if a name looks valid.
   */
  isValid(name: string | null): boolean {
    if (!name) return false;
    const trimmed = name.trim();
    // Name should have at least 2 characters and contain letters
    return trimmed.length >= 2 && /[a-zA-Z]/.test(trimmed);
  }
}


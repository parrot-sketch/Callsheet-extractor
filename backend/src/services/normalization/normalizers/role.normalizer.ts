/**
 * Role Normalizer
 * 
 * Standardizes role names and infers departments from roles.
 * Maps common abbreviations to full names.
 */

// Role standardization mappings
const ROLE_MAPPINGS: Record<string, string> = {
  // Camera Department
  "dp": "Director of Photography",
  "dop": "Director of Photography",
  "1st ac": "1st Assistant Camera",
  "2nd ac": "2nd Assistant Camera",
  "a/c": "Assistant Camera",
  "ac": "Assistant Camera",
  "cam op": "Camera Operator",
  "steadicam": "Steadicam Operator",
  "digi tech": "Digital Technician",
  "dit": "Digital Imaging Technician",
  
  // Grip/Electric
  "gaffer": "Gaffer",
  "key grip": "Key Grip",
  "best boy": "Best Boy",
  "best boy electric": "Best Boy Electric",
  "best boy grip": "Best Boy Grip",
  "grip": "Grip",
  "electric": "Electric",
  
  // Production
  "ad": "Assistant Director",
  "1st ad": "1st Assistant Director",
  "2nd ad": "2nd Assistant Director",
  "pa": "Production Assistant",
  "pm": "Production Manager",
  "upm": "Unit Production Manager",
  "lm": "Location Manager",
  "loc manager": "Location Manager",
  
  // Art Department
  "prod designer": "Production Designer",
  "art director": "Art Director",
  "set dresser": "Set Dresser",
  "prop master": "Property Master",
  "prop stylist": "Prop Stylist",
  "props": "Props",
  "prop asst": "Prop Assistant",
  
  // Hair/Makeup/Wardrobe
  "hmu": "Hair & Makeup",
  "hmua": "Hair & Makeup Artist",
  "mua": "Makeup Artist",
  "hair/makeup": "Hair & Makeup",
  "groomer": "Groomer",
  "wardrobe": "Wardrobe Stylist",
  "wardrobe asst": "Wardrobe Assistant",
  "stylist": "Stylist",
  
  // Sound
  "sound": "Sound Mixer",
  "audio": "Audio",
  "boom op": "Boom Operator",
  "sound mixer": "Sound Mixer",
  
  // Photo
  "photo": "Photographer",
  "photographer": "Photographer",
  "photo asst": "Photo Assistant",
  "photo assistant": "Photo Assistant",
  "digital tech": "Digital Technician",
  
  // Other
  "bts": "Behind The Scenes",
  "craft services": "Craft Services",
  "crafty": "Craft Services",
  "medic": "Set Medic",
  "covid officer": "COVID Compliance Officer",
};

// Department inference from role keywords
const DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  "Camera": ["camera", "dp", "dop", "ac", "steadicam", "dit", "digi", "photo", "photographer"],
  "Grip & Electric": ["grip", "gaffer", "electric", "best boy", "lighting"],
  "Production": ["producer", "production", "ad", "assistant director", "coordinator", "pm", "upm"],
  "Art": ["art", "prop", "set", "scenic", "designer", "decorator"],
  "Hair & Makeup": ["hair", "makeup", "hmu", "mua", "groomer", "beauty"],
  "Wardrobe": ["wardrobe", "costume", "stylist"],
  "Sound": ["sound", "audio", "boom", "mixer"],
  "Locations": ["location", "loc manager"],
  "Transport": ["driver", "transport", "picture car"],
  "Talent": ["talent", "actor", "actress", "model", "cast"],
  "Creative": ["director", "creative", "writer"],
  "Video": ["video", "editor", "post"],
};

export class RoleNormalizer {
  /**
   * Normalize a role name to standard form.
   */
  normalizeRole(role: string | null): string | null {
    if (!role) return null;

    const trimmed = role.trim();
    if (!trimmed) return null;

    // Check for exact mapping (case-insensitive)
    const lowerRole = trimmed.toLowerCase();
    if (ROLE_MAPPINGS[lowerRole]) {
      return ROLE_MAPPINGS[lowerRole];
    }

    // Check for partial matches
    for (const [abbrev, full] of Object.entries(ROLE_MAPPINGS)) {
      if (lowerRole === abbrev || lowerRole.includes(abbrev)) {
        return full;
      }
    }

    // Title case the original if no mapping found
    return this.toTitleCase(trimmed);
  }

  /**
   * Infer department from role if not provided.
   */
  inferDepartment(role: string | null, existingDepartment: string | null): string | null {
    // Keep existing department if present
    if (existingDepartment && existingDepartment.trim()) {
      return existingDepartment;
    }

    if (!role) return null;

    const lowerRole = role.toLowerCase();

    // Check each department's keywords
    for (const [department, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerRole.includes(keyword)) {
          return department;
        }
      }
    }

    return null;
  }

  /**
   * Convert string to Title Case.
   */
  private toTitleCase(str: string): string {
    return str
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
}


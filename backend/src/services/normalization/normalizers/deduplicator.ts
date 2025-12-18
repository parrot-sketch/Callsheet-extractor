/**
 * Contact Deduplicator
 * 
 * Removes duplicate contacts by merging based on matching criteria.
 * Merges contacts with same name, phone, or email.
 */

interface Contact {
  name: string;
  role: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export class Deduplicator {
  /**
   * Deduplicate contacts by merging similar entries.
   * Returns deduplicated list and count of removed duplicates.
   */
  deduplicate(contacts: Contact[]): { contacts: Contact[]; removedCount: number } {
    if (contacts.length === 0) {
      return { contacts: [], removedCount: 0 };
    }

    const mergedMap = new Map<string, Contact>();
    let removedCount = 0;

    for (const contact of contacts) {
      const key = this.generateKey(contact);
      const existing = mergedMap.get(key);

      if (existing) {
        // Merge contacts - keep more complete information
        mergedMap.set(key, this.mergeContacts(existing, contact));
        removedCount++;
      } else {
        mergedMap.set(key, { ...contact });
      }
    }

    return {
      contacts: Array.from(mergedMap.values()),
      removedCount,
    };
  }

  /**
   * Generate a unique key for a contact.
   * Uses normalized name + phone or email for matching.
   */
  private generateKey(contact: Contact): string {
    const normalizedName = contact.name.toLowerCase().trim().replace(/\s+/g, " ");
    const normalizedPhone = contact.phone?.replace(/\D/g, "") || "";
    const normalizedEmail = contact.email?.toLowerCase().trim() || "";

    // Primary key: name + phone (if phone exists)
    if (normalizedPhone.length >= 7) {
      return `${normalizedName}|${normalizedPhone}`;
    }

    // Secondary key: name + email (if email exists)
    if (normalizedEmail) {
      return `${normalizedName}|${normalizedEmail}`;
    }

    // Fallback: just name
    return normalizedName;
  }

  /**
   * Merge two contacts, keeping the most complete information.
   */
  private mergeContacts(existing: Contact, newContact: Contact): Contact {
    return {
      name: existing.name || newContact.name,
      role: existing.role || newContact.role,
      department: existing.department || newContact.department,
      phone: existing.phone || newContact.phone,
      email: existing.email || newContact.email,
      notes: this.mergeNotes(existing.notes, newContact.notes),
    };
  }

  /**
   * Merge notes fields.
   */
  private mergeNotes(existing: string | null, newNotes: string | null): string | null {
    if (!existing && !newNotes) return null;
    if (!existing) return newNotes;
    if (!newNotes) return existing;
    if (existing === newNotes) return existing;
    return `${existing}; ${newNotes}`;
  }
}


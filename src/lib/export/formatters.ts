/**
 * Export Formatters
 * Convert contacts to various file formats
 */

import type { ExportableContact } from "./types";

/**
 * Format contacts as CSV
 */
export function formatAsCSV(contacts: ExportableContact[]): string {
  const headers = ["Name", "Role", "Department", "Phone", "Email"];
  const rows = contacts.map((c) => [
    escapeCSV(c.name),
    escapeCSV(c.role || ""),
    escapeCSV(c.department || ""),
    escapeCSV(c.phone || ""),
    escapeCSV(c.email || ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format contacts as vCard (.vcf)
 * Standard format for contact apps
 */
export function formatAsVCard(contacts: ExportableContact[]): string {
  return contacts
    .map((c) => {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${c.name}`,
      ];

      // Parse name into parts if possible
      const nameParts = c.name.split(" ");
      if (nameParts.length >= 2) {
        const lastName = nameParts.pop();
        const firstName = nameParts.join(" ");
        lines.push(`N:${lastName};${firstName};;;`);
      } else {
        lines.push(`N:${c.name};;;;`);
      }

      if (c.role) {
        lines.push(`TITLE:${c.role}`);
      }

      if (c.department) {
        lines.push(`ORG:;${c.department}`);
      }

      if (c.phone) {
        lines.push(`TEL;TYPE=WORK:${c.phone}`);
      }

      if (c.email) {
        lines.push(`EMAIL;TYPE=WORK:${c.email}`);
      }

      lines.push("END:VCARD");
      return lines.join("\r\n");
    })
    .join("\r\n");
}

/**
 * Format contacts as JSON
 */
export function formatAsJSON(contacts: ExportableContact[]): string {
  const cleanContacts = contacts.map((c) => ({
    name: c.name,
    ...(c.role && { role: c.role }),
    ...(c.department && { department: c.department }),
    ...(c.phone && { phone: c.phone }),
    ...(c.email && { email: c.email }),
  }));

  return JSON.stringify(cleanContacts, null, 2);
}

/**
 * Format contacts as plain text
 */
export function formatAsText(contacts: ExportableContact[]): string {
  return contacts
    .map((c) => {
      const lines = [c.name];
      
      if (c.role) lines.push(c.role);
      if (c.phone) lines.push(c.phone);
      if (c.email) lines.push(c.email);

      return lines.join("\n");
    })
    .join("\n\n");
}


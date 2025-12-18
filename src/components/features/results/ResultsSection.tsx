import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactCard } from "./ContactCard";
import { ExportMenu } from "./ExportMenu";
import type { ExtractionResult } from "@/lib/extraction-types";

interface ResultsSectionProps {
  result: ExtractionResult | null;
  onReset: () => void;
}

type Tab = "contacts" | "locations" | "emergency";

/**
 * Check if a contact has actual contact information
 */
function hasContactInfo(contact: { phone?: string | null; email?: string | null }): boolean {
  return !!(contact.phone?.trim() || contact.email?.trim());
}

/**
 * ResultsSection - Display extraction results
 * Only shows contacts that have phone or email
 */
export function ResultsSection({ result, onReset }: ResultsSectionProps) {
  const [tab, setTab] = useState<Tab>("contacts");

  // Empty state
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
        <p className="text-muted-foreground">
          Upload a callsheet to see extracted contacts
        </p>
      </div>
    );
  }

  // Filter contacts to only those with actual contact info
  const contactsWithInfo = result.contacts.filter(hasContactInfo);
  const skippedCount = result.contacts.length - contactsWithInfo.length;

  // Generate filename from production info
  const exportFilename = result.production_info.title
    ? result.production_info.title.toLowerCase().replace(/\s+/g, "-")
    : `contacts-${Date.now()}`;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "contacts", label: "Contacts", count: contactsWithInfo.length },
    { id: "locations", label: "Locations", count: result.locations.length },
    { id: "emergency", label: "Emergency", count: result.emergency_contacts.length },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2>Extracted Data</h2>
          {result.production_info.production_company && (
            <p className="text-sm text-muted-foreground">
              {result.production_info.production_company}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <ExportMenu contacts={contactsWithInfo} filename={exportFilename} />
          <Button variant="ghost" size="sm" onClick={onReset}>
            New
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-4 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 pb-2 text-sm font-medium transition-colors ${tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-muted-foreground">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[500px] overflow-y-auto">
        {tab === "contacts" && (
          contactsWithInfo.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No contacts with phone or email found
            </p>
          ) : (
            <>
              {contactsWithInfo.map((contact, idx) => (
                <ContactCard
                  key={idx}
                  name={contact.name}
                  role={contact.role}
                  department={contact.department}
                  phone={contact.phone}
                  email={contact.email}
                />
              ))}
              {/* Skipped count removed for cleaner UI */}
            </>
          )
        )}

        {tab === "locations" && (
          result.locations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No locations found
            </p>
          ) : (
            result.locations.map((loc, idx) => (
              <div key={idx} className="border-b py-3 last:border-0">
                <p className="font-medium">{loc.name || "Location"}</p>
                {loc.address && (
                  <p className="text-sm text-muted-foreground">{loc.address}</p>
                )}
                {loc.phone && (
                  <a href={`tel:${loc.phone}`} className="text-sm text-muted-foreground hover:text-foreground">
                    {loc.phone}
                  </a>
                )}
              </div>
            ))
          )
        )}

        {tab === "emergency" && (
          result.emergency_contacts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No emergency contacts found
            </p>
          ) : (
            result.emergency_contacts.map((ec, idx) => (
              <div key={idx} className="border-b py-3 last:border-0">
                <p className="font-medium">
                  {ec.name || ec.type}
                  {ec.name && <span className="ml-2 text-sm text-muted-foreground">({ec.type})</span>}
                </p>
                {ec.phone && (
                  <a href={`tel:${ec.phone}`} className="text-sm text-muted-foreground hover:text-foreground">
                    {ec.phone}
                  </a>
                )}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

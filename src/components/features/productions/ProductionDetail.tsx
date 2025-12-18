import { Button } from "@/components/ui/button";
import { ContactCard } from "../results/ContactCard";
import type { ProductionDetail as ProductionDetailType } from "@/lib/extraction-types";

interface ProductionDetailProps {
  data: ProductionDetailType;
  onBack: () => void;
}

/**
 * ProductionDetail - Single production view
 */
export function ProductionDetail({ data, onBack }: ProductionDetailProps) {
  const { production, uploads, contacts } = data;

  return (
    <div>
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        ← Back
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1>{production.name}</h1>
        <p className="text-sm text-muted-foreground">
          {contacts.length} contact{contacts.length !== 1 ? "s" : ""} · {uploads.length} upload{uploads.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Uploads */}
      {uploads.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-muted-foreground">Uploads</h3>
          <div className="divide-y rounded-lg border">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{upload.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {upload.status === "completed" && `${upload.contacts_extracted} contacts`}
                    {upload.status === "processing" && "Processing..."}
                    {upload.status === "failed" && "Failed"}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium ${
                    upload.status === "completed"
                      ? "text-green-600"
                      : upload.status === "failed"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {upload.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      <div>
        <h3 className="mb-2 text-muted-foreground">Contacts</h3>
        {contacts.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed py-8 text-center">
            <p className="text-sm text-muted-foreground">No contacts</p>
          </div>
        ) : (
          <div className="rounded-lg border px-4">
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                name={contact.name}
                role={contact.role}
                phone={contact.phone}
                email={contact.email}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { exportContacts, copyContactsToClipboard, EXPORT_OPTIONS } from "@/lib/export";
import type { ExportableContact, ExportFormat } from "@/lib/export";

interface ExportMenuProps {
  contacts: ExportableContact[];
  filename?: string;
}

/**
 * ExportMenu - Simple dropdown for exporting contacts
 */
export function ExportMenu({ contacts, filename = "contacts" }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleExport = (format: ExportFormat) => {
    exportContacts(contacts, format, filename);
    setOpen(false);
  };

  const handleCopy = async () => {
    await copyContactsToClipboard(contacts);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1000);
  };

  if (contacts.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Download className="mr-1.5 h-4 w-4" />
        Export
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-md border bg-card py-1 shadow-lg">
          {EXPORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleExport(option.id)}
              className="flex w-full items-center px-3 py-2 text-sm hover:bg-muted"
            >
              {option.label}
            </button>
          ))}
          <div className="my-1 border-t" />
          <button
            onClick={handleCopy}
            className="flex w-full items-center px-3 py-2 text-sm hover:bg-muted"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              "Copy to clipboard"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

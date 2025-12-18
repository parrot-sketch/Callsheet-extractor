import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  xls: "📊",
  xlsx: "📊",
  png: "🖼",
  jpg: "🖼",
  jpeg: "🖼",
};

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return FILE_ICONS[ext] || "📁";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * FilePreview - Shows selected file with remove option
 */
export function FilePreview({ file, onRemove, disabled }: FilePreviewProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
      <span className="text-2xl">{getFileIcon(file.name)}</span>
      
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={disabled}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}


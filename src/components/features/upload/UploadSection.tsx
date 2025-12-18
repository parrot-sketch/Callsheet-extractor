import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "./FileDropzone";
import { FilePreview } from "./FilePreview";
import { Loader2 } from "lucide-react";

type InputMode = "file" | "text";

interface UploadSectionProps {
  productionName: string;
  onProductionNameChange: (name: string) => void;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  pastedText: string;
  onPastedTextChange: (text: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  error: string | null;
}

/**
 * UploadSection - Complete upload interface
 * Single, clear flow for file or text input
 */
export function UploadSection({
  productionName,
  onProductionNameChange,
  selectedFile,
  onFileSelect,
  pastedText,
  onPastedTextChange,
  onSubmit,
  isProcessing,
  error,
}: UploadSectionProps) {
  const [mode, setMode] = useState<InputMode>("file");

  const hasInput = mode === "file" ? !!selectedFile : pastedText.trim().length > 0;
  const canSubmit = hasInput && !isProcessing;

  const handleModeChange = (newMode: InputMode) => {
    setMode(newMode);
    if (newMode === "text") {
      onFileSelect(null);
    } else {
      onPastedTextChange("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">New Extraction</h2>
        <p className="text-muted-foreground text-sm">
          Import a callsheet to extract contacts and production details.
        </p>
      </div>

      {/* Production Name (Optional) */}
      <div className="space-y-2">
        <label htmlFor="production" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Production Name <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
        </label>
        <Input
          id="production"
          value={productionName}
          onChange={(e) => onProductionNameChange(e.target.value)}
          placeholder="e.g. 'Project Alpha Day 1' (defaults to filename)"
          disabled={isProcessing}
          className="h-10 bg-background/50"
        />
      </div>

      {/* Input Method Toggle */}
      <div className="rounded-lg bg-muted p-1 grid grid-cols-2 gap-1 w-full max-w-[200px]">
        <button
          onClick={() => handleModeChange("file")}
          disabled={isProcessing}
          className={`
            rounded-md px-3 py-1.5 text-sm font-medium transition-all
            ${mode === "file"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:bg-background/50"
            }
          `}
        >
          Upload File
        </button>
        <button
          onClick={() => handleModeChange("text")}
          disabled={isProcessing}
          className={`
            rounded-md px-3 py-1.5 text-sm font-medium transition-all
            ${mode === "text"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:bg-background/50"
            }
          `}
        >
          Paste Text
        </button>
      </div>

      {/* Main Input Area */}
      <div className="min-h-[300px] animate-in fade-in zoom-in-95 duration-200">
        {mode === "file" && (
          <>
            {selectedFile ? (
              <FilePreview
                file={selectedFile}
                onRemove={() => onFileSelect(null)}
                disabled={isProcessing}
              />
            ) : (
              <FileDropzone
                onFileSelect={onFileSelect}
                disabled={isProcessing}
                accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.xls"
              />
            )}
          </>
        )}

        {mode === "text" && (
          <Textarea
            value={pastedText}
            onChange={(e) => onPastedTextChange(e.target.value)}
            placeholder="Paste raw callsheet content here..."
            disabled={isProcessing}
            className="min-h-[300px] resize-none font-mono text-sm bg-background/50 leading-relaxed"
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2 animate-in slide-in-from-top-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Actions */}
      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full h-11 text-base font-medium shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing Callsheet...
          </>
        ) : (
          "Start Extraction"
        )}
      </Button>
    </div>
  );
}


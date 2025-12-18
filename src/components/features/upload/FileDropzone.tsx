import { useRef, useState, useCallback } from "react";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  accept?: string;
}

/**
 * FileDropzone - Single file drop area
 * Clean, minimal design with clear feedback
 */
export function FileDropzone({ onFileSelect, disabled, accept }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  }, [disabled, onFileSelect]);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 ease-in-out
        flex cursor-pointer flex-col items-center justify-center py-16 px-8
        ${isDragging
          ? "border-primary bg-primary/5 scale-[0.99]"
          : "border-border/50 bg-background/50 hover:border-primary/50 hover:bg-muted/30"
        }
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      <div className={`
        mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 transition-transform duration-300
        ${isDragging ? "scale-110 bg-primary/10" : "group-hover:scale-110"}
      `}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`h-8 w-8 text-muted-foreground transition-colors duration-300 ${isDragging ? "text-primary" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-lg font-medium text-foreground">
          {isDragging ? "Drop file here" : "Upload callsheet"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Drag & drop or click to select
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {['PDF', 'Word', 'Excel', 'Images'].map((type) => (
            <span key={type} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}


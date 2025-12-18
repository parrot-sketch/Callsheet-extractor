import type { Production } from "@/lib/extraction-types";

interface ProductionListProps {
  productions: Production[];
  onSelect: (id: string) => void;
}

/**
 * ProductionList - List of productions
 */
export function ProductionList({ productions, onSelect }: ProductionListProps) {
  if (productions.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed py-16 text-center">
        <p className="text-muted-foreground">No productions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Extract a callsheet to get started
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {productions.map((prod) => (
        <button
          key={prod.id}
          onClick={() => onSelect(prod.id)}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
        >
          <div>
            <p className="font-medium">{prod.name}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(prod.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className="text-muted-foreground">→</span>
        </button>
      ))}
    </div>
  );
}


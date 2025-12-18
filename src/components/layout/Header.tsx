import { Button } from "@/components/ui/button";

interface HeaderProps {
  email?: string;
  onSignOut: () => void;
}

/**
 * Header - Application header with navigation
 */
export function Header({ email, onSignOut }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Callsheet Converter</span>
        </div>

        <div className="flex items-center gap-3">
          {email && (
            <span className="text-sm text-muted-foreground">
              {email}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}


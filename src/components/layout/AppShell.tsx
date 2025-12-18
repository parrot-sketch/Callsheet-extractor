import { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
}

/**
 * AppShell - Main application layout wrapper
 * Provides consistent structure for all pages
 */
export function AppShell({ children, header }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <main className="flex-1">{children}</main>
    </div>
  );
}


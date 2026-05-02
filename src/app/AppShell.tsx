import type { PropsWithChildren } from 'react';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <main className="app-shell" aria-label="Daily Listen Up">
      <div className="app-shell__content">{children}</div>
    </main>
  );
}

import { AppHeader } from "@/components/app-header";

import { SessionTimerProvider } from "@/modules/sessions/ui/providers/session-timer-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionTimerProvider>
      <div className="flex h-svh flex-col">
        <AppHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </SessionTimerProvider>
  );
}

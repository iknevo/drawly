"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

import { ModeSwitch } from "@/modules/sessions/ui/components/mode-switch";
import { SessionClock } from "@/modules/sessions/ui/components/session-clock";
import { SessionControls } from "@/modules/sessions/ui/components/session-controls";
import { SessionSettings } from "@/modules/sessions/ui/components/session-settings";
import type { useSessionTimer } from "@/modules/sessions/ui/hooks/use-session-timer";

type SessionTimerProps = {
  timer: ReturnType<typeof useSessionTimer>;
};

export function SessionTimer({ timer }: SessionTimerProps) {
  const { pomodoro, config, mode, status, draft, pendingModeSwitch } = timer;
  const editing = status === "idle";

  return (
    <section className="border-border flex flex-col gap-6 rounded-xl border p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ModeSwitch mode={mode} onModeChange={timer.requestModeChange} />
          <SessionSettings
            mode={mode}
            targetSeconds={draft.targetSeconds}
            onTargetChange={timer.setDraftTarget}
            targetDisabled={!editing}
            config={config}
            onConfigChange={timer.applyConfig}
            onConfigCommit={timer.persistConfig}
          />
        </div>
        <SessionControls
          status={status}
          done={pomodoro?.done ?? false}
          onToggle={timer.toggle}
          onReset={timer.reset}
          onComplete={timer.complete}
          isPending={timer.isPending}
        />
      </div>

      <div className="flex justify-center">
        <Input
          value={draft.name}
          disabled={!editing}
          maxLength={120}
          placeholder="Anonymous"
          aria-label="Session name"
          onChange={(event) => timer.setDraftName(event.target.value)}
          className="hover:border-input focus-visible:border-ring h-9 w-full max-w-sm border-transparent bg-transparent text-center text-lg font-medium shadow-none transition-colors disabled:bg-transparent disabled:opacity-100 dark:disabled:bg-transparent"
        />
      </div>

      <SessionClock
        mode={mode}
        status={status}
        elapsed={timer.elapsed}
        pomodoro={pomodoro}
        cyclesTotal={config.cycles}
      />

      <AlertDialog
        open={pendingModeSwitch !== null}
        onOpenChange={(open) => {
          if (!open) timer.cancelModeSwitch();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {pendingModeSwitch === "pomodoro" ? "Pomodoro" : "Timer"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your current session will be discarded and the history entry removed. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={timer.confirmModeSwitch}>Switch</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TimerIcon, WatchIcon } from "lucide-react";

export function SessionList({ sessions }: { sessions: any[] }) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  };

  return (
    <div className="flex flex-col gap-2">
      {sessions.map((session) => (
        <SessionListItem
          key={session.id}
          session={session}
          formatTime={formatTime}
        />
      ))}
    </div>
  );
}

function SessionListItem({
  session,
  formatTime,
}: {
  session: any;
  formatTime: (seconds: number) => string;
}) {
  return (
    <Link href="/sessions" className={cn("flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors")}>
      <div className="flex items-center justify-center w-8 h-8 rounded bg-muted/50">
        {session.type === "timer" ? <TimerIcon className="size-4" /> : <WatchIcon className="size-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate">{session.name}</p>
          <p className="text-xs text-muted-foreground">{formatTime(session.elapsedSeconds)}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {session.type} • {session.status}
        </p>
      </div>
    </Link>
  );
}

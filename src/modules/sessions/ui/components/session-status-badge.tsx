"use client";

import { cn } from "cn";

import { Badge } from "@/components/ui/badge";

import { STATUS_META, type SessionDisplayStatus } from "@/modules/sessions/lib/status";

type SessionStatusBadgeProps = {
  status: SessionDisplayStatus;
  className?: string;
};

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <Badge variant={meta.variant} className={cn("text-[0.65rem]", className)}>
      {meta.label}
    </Badge>
  );
}

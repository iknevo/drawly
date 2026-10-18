"use client";

import { GhostIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function SessionEmptyState() {
  return (
    <Empty className="py-20">
      <EmptyHeader>
        <EmptyMedia>
          <GhostIcon className="size-10" />
        </EmptyMedia>
        <EmptyTitle>No sessions yet</EmptyTitle>
        <EmptyDescription>Create your first session to start tracking time.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

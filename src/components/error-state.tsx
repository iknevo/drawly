"use client";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <TriangleAlertIcon className="text-muted-foreground size-8" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RotateCcwIcon />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

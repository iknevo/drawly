"use client";

import React from "react";

import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-center justify-between gap-4", className)}>
      <div>
        <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </header>
  );
}

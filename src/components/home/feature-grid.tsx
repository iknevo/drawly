"use client";

import Link from "next/link";

import { features } from "@/lib/features";
import { cn } from "@/lib/utils";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const iconButtonClass =
  "flex size-16 items-center justify-center rounded-xl border bg-card text-foreground ring-1 ring-foreground/10 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-7";

export function FeatureGrid() {
  return (
    <section className="flex w-full flex-col items-center gap-8">
      <h1 className="text-center text-3xl font-light select-none sm:text-4xl">
        What are you looking for?
      </h1>
      <TooltipProvider delay={300}>
        <ul className="flex flex-wrap items-center justify-center gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const soon = feature.status === "soon";

            return (
              <li key={feature.id}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      soon ? (
                        <button
                          type="button"
                          aria-disabled="true"
                          onClick={(event) => event.preventDefault()}
                          className={cn(
                            iconButtonClass,
                            "cursor-not-allowed opacity-60 hover:bg-transparent"
                          )}
                        />
                      ) : (
                        <Link href={feature.href} className={iconButtonClass} />
                      )
                    }
                  >
                    <Icon />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{feature.label}</TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </TooltipProvider>
    </section>
  );
}

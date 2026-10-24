"use client";

import { format, parseISO } from "date-fns";
import { Bar, BarChart, XAxis } from "recharts";

import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { formatDuration } from "@/modules/sessions/lib/time";
import type { sessionStatsOutput } from "@/modules/sessions/types/types";

const chartConfig = {
  seconds: {
    label: "Focus time",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function SessionActivityChart({ week }: { week: sessionStatsOutput["week"] }) {
  const data = week.map((entry) => ({
    day: format(parseISO(entry.date), "EEE"),
    date: entry.date,
    seconds: entry.seconds,
  }));
  const total = week.reduce((sum, entry) => sum + entry.seconds, 0);

  return (
    <Card size="sm" className="gap-3 px-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Last 7 days</span>
        <span className="text-muted-foreground text-xs tabular-nums">{formatDuration(total)}</span>
      </div>
      <ChartContainer config={chartConfig} className="h-32 w-full">
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_label, payload) => {
                  const date = payload[0]?.payload as { date?: string } | undefined;
                  return date?.date ? format(parseISO(date.date), "EEE, MMM d") : "";
                }}
                formatter={(value) => formatDuration(Number(value))}
              />
            }
          />
          <Bar dataKey="seconds" fill="var(--color-seconds)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}

"use client";

import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_DESCRIPTIONS,
  TEMPLATE_LABELS,
  type TemplateId,
} from "../../lib/templates";
import {
  CalendarDaysIcon,
  Columns3Icon,
  Grid2x2Icon,
  LayoutGridIcon,
  LayoutTemplateIcon,
  ListChecksIcon,
  type LucideIcon,
  MilestoneIcon,
  NetworkIcon,
  NotebookTextIcon,
  PlusIcon,
  Repeat2Icon,
  SquarePenIcon,
  WaypointsIcon,
  WorkflowIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const TEMPLATE_ICONS: Record<TemplateId, LucideIcon> = {
  checklist: ListChecksIcon,
  kanban: Columns3Icon,
  weekly: CalendarDaysIcon,
  roadmap: MilestoneIcon,
  retro: Repeat2Icon,
  eisenhower: Grid2x2Icon,
  swot: LayoutGridIcon,
  mindmap: NetworkIcon,
  flowchart: WorkflowIcon,
  bubblemap: WaypointsIcon,
  cornell: NotebookTextIcon,
  wireframe: LayoutTemplateIcon,
};

export function NewBoardMenu({
  size,
  disabled,
  onCreate,
  align = "start",
}: {
  size?: "sm" | "default" | "lg";
  disabled: boolean;
  onCreate: (template?: TemplateId) => void;
  align?: "start" | "center" | "end";
}) {
  return (
    <NavigationMenu align={align} className="flex-none">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            disabled={disabled}
            data-sound-hover
            render={<Button size={size} variant="outline" disabled={disabled} />}
          >
            <PlusIcon />
            New board
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-140 p-3">
              <NavigationMenuLink
                closeOnClick
                render={
                  <button type="button" onClick={() => onCreate()} className="w-full gap-2.5" />
                }
              >
                <SquarePenIcon />
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-medium">Blank board</span>
                  <span className="text-muted-foreground text-xs">Start from an empty canvas</span>
                </span>
              </NavigationMenuLink>

              {TEMPLATE_CATEGORIES.map((category) => (
                <section key={category.id}>
                  <div className="text-muted-foreground px-2 pt-3 pb-1 text-xs font-medium">
                    {category.label}
                  </div>
                  <div className="grid grid-cols-2 gap-0.5">
                    {category.templates.map((id) => {
                      const Icon = TEMPLATE_ICONS[id];
                      return (
                        <NavigationMenuLink
                          key={id}
                          closeOnClick
                          render={
                            <button
                              type="button"
                              onClick={() => onCreate(id)}
                              className="gap-2.5"
                            />
                          }
                        >
                          <Icon />
                          <span className="flex flex-col items-start gap-0.5">
                            <span className="font-medium">{TEMPLATE_LABELS[id]}</span>
                            <span className="text-muted-foreground text-xs">
                              {TEMPLATE_DESCRIPTIONS[id]}
                            </span>
                          </span>
                        </NavigationMenuLink>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

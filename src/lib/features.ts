import {
  FileTextIcon,
  KanbanIcon,
  type LucideIcon,
  PencilRulerIcon,
  TimerIcon,
} from "lucide-react";

export type FeatureStatus = "available" | "soon";

export type Feature = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: FeatureStatus;
};

export const features: Feature[] = [
  {
    id: "boards",
    label: "Boards",
    description: "Sketch ideas and wireframes on an infinite canvas.",
    href: "/boards",
    icon: PencilRulerIcon,
    status: "available",
  },
  {
    id: "kanban",
    label: "Kanban",
    description: "Plan work on a board with drag-and-drop lists.",
    href: "/kanban",
    icon: KanbanIcon,
    status: "available",
  },
  {
    id: "docs",
    label: "Docs",
    description: "Write notes, drafts, and everything in between.",
    href: "/docs",
    icon: FileTextIcon,
    status: "available",
  },
  {
    id: "sessions",
    label: "Sessions",
    description: "Track time with timers and Pomodoro sessions.",
    href: "/sessions",
    icon: TimerIcon,
    status: "available",
  },
];

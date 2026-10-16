import { KanbanIcon, type LucideIcon, PencilRulerIcon, ShapesIcon } from "lucide-react";

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
    id: "feature-three",
    label: "Feature three",
    description: "Something new is on the way.",
    href: "/",
    icon: ShapesIcon,
    status: "soon",
  },
];

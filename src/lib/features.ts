import { LayoutGridIcon, type LucideIcon, PencilRulerIcon, ShapesIcon } from "lucide-react";

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
    id: "feature-two",
    label: "Feature two",
    description: "Something new is on the way.",
    href: "/",
    icon: LayoutGridIcon,
    status: "soon",
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

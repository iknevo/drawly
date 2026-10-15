export const TEMPLATE_IDS = [
  "checklist",
  "kanban",
  "weekly",
  "roadmap",
  "retro",
  "eisenhower",
  "swot",
  "mindmap",
  "flowchart",
  "bubblemap",
  "cornell",
  "wireframe",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  checklist: "Checklist",
  kanban: "Kanban",
  weekly: "Weekly planner",
  roadmap: "Roadmap",
  retro: "Retrospective",
  eisenhower: "Eisenhower matrix",
  swot: "SWOT",
  mindmap: "Mind map",
  flowchart: "Flowchart",
  bubblemap: "Bubble map",
  cornell: "Meeting notes",
  wireframe: "Wireframe",
};

export const TEMPLATE_DESCRIPTIONS: Record<TemplateId, string> = {
  checklist: "Simple task list",
  kanban: "To do, doing, done",
  weekly: "Plan your week, day by day",
  roadmap: "Timeline of milestones",
  retro: "Start, stop, continue",
  eisenhower: "Urgent vs important",
  swot: "Strengths, weaknesses, opportunities, threats",
  mindmap: "Ideas branching from a center",
  flowchart: "Steps, decisions, and arrows",
  bubblemap: "Cluster ideas around a topic",
  cornell: "Cornell-style meeting notes",
  wireframe: "UI layout skeleton",
};

export type TemplateCategory = "planning" | "diagramming" | "notes";

export const TEMPLATE_CATEGORIES: {
  id: TemplateCategory;
  label: string;
  templates: TemplateId[];
}[] = [
  {
    id: "planning",
    label: "Planning",
    templates: ["checklist", "kanban", "weekly", "roadmap", "retro", "eisenhower", "swot"],
  },
  {
    id: "diagramming",
    label: "Diagramming",
    templates: ["mindmap", "flowchart", "bubblemap"],
  },
  {
    id: "notes",
    label: "Notes & docs",
    templates: ["cornell", "wireframe"],
  },
];

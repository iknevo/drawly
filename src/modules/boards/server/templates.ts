import type { ShapeRecord, Snapshot } from "@quickdrawjs/core";

import type { TemplateId } from "@/modules/boards/lib/templates";

type ShapeInput = Pick<ShapeRecord, "type" | "x" | "y" | "props">;

type GeoStyle = {
  color?: string;
  fill?: string;
  size?: string;
  dash?: string;
};

function build(records: ShapeInput[]): Snapshot {
  const store: Record<string, ShapeRecord> = {};

  records.forEach((record, index) => {
    const id = `shape:tpl-${index}`;
    store[id] = { id, typeName: "shape", rot: 0, z: index + 1, ...record };
  });

  return { document: { store } };
}

function text(
  x: number,
  y: number,
  content: string,
  { size = "m", color = "black" }: { size?: string; color?: string } = {}
): ShapeInput {
  return {
    type: "text",
    x,
    y,
    props: { text: content, color, size, font: "sans", autosize: true, scale: 1 },
  };
}

function note(x: number, y: number, content: string, color: string): ShapeInput {
  return {
    type: "note",
    x,
    y,
    props: { text: content, color, size: "m", font: "sans", scale: 1 },
  };
}

function arrow(x: number, y: number, dx: number, dy: number, color = "grey"): ShapeInput {
  return {
    type: "arrow",
    x,
    y,
    props: { dx, dy, bend: 0, color, size: "m", dash: "solid" },
  };
}

function line(x: number, y: number, dx: number, dy: number, color = "grey"): ShapeInput {
  return {
    type: "line",
    x,
    y,
    props: { dx, dy, bend: 0, color, size: "m", dash: "solid" },
  };
}

function geo(
  x: number,
  y: number,
  kind: string,
  w: number,
  h: number,
  { color = "grey", fill = "none", size = "m", dash = "solid" }: GeoStyle = {}
): ShapeInput {
  return {
    type: "geo",
    x,
    y,
    props: { geo: kind, w, h, color, size, dash, fill, font: "sans" },
  };
}

const CHECKLIST = build([
  text(0, 0, "To-do", { size: "xl" }),
  text(0, 70, "☐ First task", { size: "l" }),
  text(0, 130, "☐ Second task", { size: "l" }),
  text(0, 190, "☐ Third task", { size: "l" }),
  text(0, 250, "☐ Fourth task", { size: "l" }),
  text(0, 310, "☐ Fifth task", { size: "l" }),
]);

const MINDMAP = build([
  arrow(0, 0, 0, -300),
  arrow(0, 0, 400, 0),
  arrow(0, 0, 0, 300),
  arrow(0, 0, -400, 0),
  note(-100, -100, "Central idea", "violet"),
  note(-100, -400, "Branch 1", "blue"),
  note(300, -100, "Branch 2", "green"),
  note(-100, 200, "Branch 3", "orange"),
  note(-500, -100, "Branch 4", "light-red"),
]);

const KANBAN = build([
  text(0, 0, "To do", { size: "l" }),
  text(280, 0, "In progress", { size: "l" }),
  text(560, 0, "Done", { size: "l" }),
  note(0, 60, "Task A", "yellow"),
  note(0, 280, "Task B", "yellow"),
  note(280, 60, "Doing", "blue"),
  note(280, 280, "Review", "blue"),
  note(560, 60, "Shipped", "green"),
  note(560, 280, "Archived", "green"),
]);

const WEEKLY = build([
  text(0, 0, "This week", { size: "xl" }),
  text(0, 80, "Monday", { size: "l" }),
  text(280, 80, "Tuesday", { size: "l" }),
  text(560, 80, "Wednesday", { size: "l" }),
  text(840, 80, "Thursday", { size: "l" }),
  text(1120, 80, "Friday", { size: "l" }),
  geo(0, 140, "rectangle", 220, 520),
  geo(280, 140, "rectangle", 220, 520),
  geo(560, 140, "rectangle", 220, 520),
  geo(840, 140, "rectangle", 220, 520),
  geo(1120, 140, "rectangle", 220, 520),
]);

const ROADMAP = build([
  text(0, 0, "Roadmap", { size: "xl" }),
  line(0, 300, 1200, 0),
  geo(0, 260, "diamond", 80, 80, { color: "violet" }),
  geo(300, 260, "diamond", 80, 80, { color: "blue" }),
  geo(600, 260, "diamond", 80, 80, { color: "green" }),
  geo(900, 260, "diamond", 80, 80, { color: "orange" }),
  geo(1200, 260, "diamond", 80, 80, { color: "red" }),
  text(-20, 180, "Research", { size: "m", color: "violet" }),
  text(285, 180, "Design", { size: "m", color: "blue" }),
  text(585, 180, "Build", { size: "m", color: "green" }),
  text(890, 180, "Test", { size: "m", color: "orange" }),
  text(1185, 180, "Launch", { size: "m", color: "red" }),
]);

const RETRO = build([
  text(0, 0, "Retrospective", { size: "xl" }),
  text(20, 80, "Start", { size: "l", color: "green" }),
  text(340, 80, "Stop", { size: "l", color: "red" }),
  text(660, 80, "Continue", { size: "l", color: "blue" }),
  note(0, 140, "", "light-green"),
  note(0, 360, "", "light-green"),
  note(320, 140, "", "light-red"),
  note(320, 360, "", "light-red"),
  note(640, 140, "", "light-blue"),
  note(640, 360, "", "light-blue"),
]);

const EISENHOWER = build([
  text(0, 0, "Eisenhower matrix", { size: "xl" }),
  geo(0, 70, "rectangle", 360, 300, { color: "red", fill: "semi" }),
  geo(380, 70, "rectangle", 360, 300, { color: "blue", fill: "semi" }),
  geo(0, 390, "rectangle", 360, 300, { color: "orange", fill: "semi" }),
  geo(380, 390, "rectangle", 360, 300, { color: "grey", fill: "semi" }),
  text(15, 85, "Do first", { size: "l", color: "red" }),
  text(395, 85, "Schedule", { size: "l", color: "blue" }),
  text(15, 405, "Delegate", { size: "l", color: "orange" }),
  text(395, 405, "Eliminate", { size: "l", color: "grey" }),
]);

const SWOT = build([
  text(0, 0, "SWOT", { size: "xl" }),
  geo(0, 70, "rectangle", 360, 300, { color: "green", fill: "semi" }),
  geo(380, 70, "rectangle", 360, 300, { color: "red", fill: "semi" }),
  geo(0, 390, "rectangle", 360, 300, { color: "blue", fill: "semi" }),
  geo(380, 390, "rectangle", 360, 300, { color: "orange", fill: "semi" }),
  text(15, 85, "Strengths", { size: "l", color: "green" }),
  text(395, 85, "Weaknesses", { size: "l", color: "red" }),
  text(15, 405, "Opportunities", { size: "l", color: "blue" }),
  text(395, 405, "Threats", { size: "l", color: "orange" }),
]);

const FLOWCHART = build([
  geo(150, 0, "ellipse", 200, 80, { color: "green" }),
  geo(150, 160, "rectangle", 200, 90, { color: "blue" }),
  geo(150, 330, "diamond", 200, 140, { color: "orange" }),
  geo(520, 355, "rectangle", 180, 90, { color: "red" }),
  geo(150, 560, "ellipse", 200, 80, { color: "green" }),
  arrow(250, 80, 0, 80),
  arrow(250, 250, 0, 80),
  arrow(350, 400, 170, 0),
  arrow(250, 470, 0, 90),
  text(205, 28, "Start", { size: "m" }),
  text(195, 195, "Process", { size: "m" }),
  text(205, 385, "Decision", { size: "m" }),
  text(555, 392, "Rework", { size: "m" }),
  text(215, 585, "End", { size: "m" }),
  text(270, 500, "Yes", { size: "s", color: "grey" }),
  text(430, 368, "No", { size: "s", color: "grey" }),
]);

const BUBBLEMAP = build([
  geo(300, 250, "ellipse", 240, 140, { color: "violet", fill: "semi" }),
  geo(330, 60, "ellipse", 180, 100, { color: "blue", fill: "semi" }),
  geo(620, 270, "ellipse", 180, 100, { color: "green", fill: "semi" }),
  geo(330, 480, "ellipse", 180, 100, { color: "orange", fill: "semi" }),
  geo(60, 270, "ellipse", 180, 100, { color: "red", fill: "semi" }),
  line(420, 250, 0, -90),
  line(540, 320, 80, 0),
  line(420, 390, 0, 90),
  line(300, 320, -150, 0),
  text(355, 300, "Main topic", { size: "m" }),
  text(400, 95, "Idea", { size: "m" }),
  text(680, 305, "Idea", { size: "m" }),
  text(400, 515, "Idea", { size: "m" }),
  text(120, 305, "Idea", { size: "m" }),
]);

const CORNELL = build([
  text(0, 0, "Topic", { size: "xl" }),
  text(720, 12, "Date", { size: "m", color: "grey" }),
  line(0, 60, 900, 0),
  line(220, 70, 0, 450),
  line(0, 520, 900, 0),
  text(0, 80, "Cues", { size: "m", color: "grey" }),
  text(240, 80, "Notes", { size: "m", color: "grey" }),
  text(0, 530, "Summary", { size: "m", color: "grey" }),
]);

const WIREFRAME = build([
  geo(0, 0, "rectangle", 900, 80),
  geo(0, 100, "rectangle", 220, 500),
  geo(240, 100, "rectangle", 660, 220),
  geo(240, 340, "rectangle", 320, 260),
  geo(580, 340, "rectangle", 320, 260),
  geo(0, 620, "rectangle", 900, 80),
  text(20, 30, "Header", { size: "m", color: "grey" }),
  text(20, 300, "Sidebar", { size: "m", color: "grey" }),
  text(540, 190, "Hero", { size: "m", color: "grey" }),
  text(380, 450, "Card", { size: "m", color: "grey" }),
  text(720, 450, "Card", { size: "m", color: "grey" }),
  text(20, 640, "Footer", { size: "m", color: "grey" }),
]);

export const TEMPLATE_SNAPSHOTS: Record<TemplateId, Snapshot> = {
  checklist: CHECKLIST,
  kanban: KANBAN,
  weekly: WEEKLY,
  roadmap: ROADMAP,
  retro: RETRO,
  eisenhower: EISENHOWER,
  swot: SWOT,
  mindmap: MINDMAP,
  flowchart: FLOWCHART,
  bubblemap: BUBBLEMAP,
  cornell: CORNELL,
  wireframe: WIREFRAME,
};

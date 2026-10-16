import mongoose, { type InferSchemaType, type Model, type Types } from "mongoose";

import { defaultKanbanColumns } from "@/modules/kanban/lib/columns";

const kanbanCardSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    title: { type: String, default: "New card" },
    description: { type: String, default: "" },
  },
  { _id: false, versionKey: false }
);

const kanbanColumnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    cards: { type: [kanbanCardSchema], default: [] },
  },
  { _id: false, versionKey: false }
);

const kanbanBoardSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true },
    title: { type: String, default: "Untitled board" },
    columns: { type: [kanbanColumnSchema], default: () => defaultKanbanColumns() },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

kanbanBoardSchema.index({ ownerId: 1, updatedAt: -1 });

export type KanbanBoardDoc = InferSchemaType<typeof kanbanBoardSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const KanbanBoard: Model<KanbanBoardDoc> =
  (mongoose.models.KanbanBoard as Model<KanbanBoardDoc>) ??
  mongoose.model<KanbanBoardDoc>("KanbanBoard", kanbanBoardSchema);

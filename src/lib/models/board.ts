import mongoose, { type InferSchemaType, type Model, type Types } from "mongoose";

const boardSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true },
    title: { type: String, default: "Untitled board" },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ document: { store: {} } }),
    },
    thumbnail: { type: String, default: null },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

boardSchema.index({ ownerId: 1, updatedAt: -1 });

export type BoardDoc = InferSchemaType<typeof boardSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Board: Model<BoardDoc> =
  (mongoose.models.Board as Model<BoardDoc>) ?? mongoose.model<BoardDoc>("Board", boardSchema);

import mongoose, { type InferSchemaType, type Model, type Types } from "mongoose";

const emptyDocument = () => ({ type: "doc", content: [{ type: "paragraph" }] });

const docSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true },
    title: { type: String, default: "Untitled doc" },
    content: { type: mongoose.Schema.Types.Mixed, default: emptyDocument },
    excerpt: { type: String, default: "" },
    rev: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

docSchema.index({ ownerId: 1, updatedAt: -1 });

export type DocDocument = InferSchemaType<typeof docSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Doc: Model<DocDocument> =
  (mongoose.models.Doc as Model<DocDocument>) ?? mongoose.model<DocDocument>("Doc", docSchema);

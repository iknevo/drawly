import mongoose, { type InferSchemaType, type Model, type Types } from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true },
    type: { type: String, enum: ["timer", "pomodoro"], required: true },
    name: { type: String, trim: true, maxlength: 120, default: "Anonymous" },
    targetSeconds: { type: Number, min: 0, default: 0 },
    elapsedSeconds: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["idle", "running", "paused", "completed"],
      default: "idle",
    },
    pomodoroConfig: {
      work: { type: Number, default: 1500 },
      shortBreak: { type: Number, default: 300 },
      longBreak: { type: Number, default: 900 },
      cycles: { type: Number, default: 4 },
    },
    currentCycle: { type: Number, default: 1 },
    currentPhase: {
      type: String,
      enum: ["work", "shortBreak", "longBreak"],
      default: "work",
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

sessionSchema.index({ ownerId: 1, updatedAt: -1 });
sessionSchema.index({ ownerId: 1, createdAt: -1 });

export type SessionDoc = InferSchemaType<typeof sessionSchema> & {
  _id: Types.ObjectId;
};

export const Session: Model<SessionDoc> =
  (mongoose.models.Session as Model<SessionDoc>) ??
  mongoose.model<SessionDoc>("Session", sessionSchema);

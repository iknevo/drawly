import mongoose, { type InferSchemaType, type Model, type Types } from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    type: { type: String, enum: ["timer", "pomodoro"], required: true },
    name: { type: String, default: "Anonymous" },
    targetSeconds: { type: Number, default: 0 },
    elapsedSeconds: { type: Number, default: 0 },
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
  },
  { timestamps: true },
);

sessionSchema.index({ userId: 1, updatedAt: -1 });

export type SessionDoc = InferSchemaType<typeof sessionSchema> & {
  _id: Types.ObjectId;
};

export const Session: Model<SessionDoc> =
  (mongoose.models.Session as Model<SessionDoc>) ??
  mongoose.model<SessionDoc>("Session", sessionSchema);

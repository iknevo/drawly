import mongoose, { type InferSchemaType, type Model, type Types } from "mongoose";

const pomodoroCycleSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    ownerId: { type: String, required: true },
    cycleIndex: { type: Number, required: true, min: 1 },
    phase: {
      type: String,
      enum: ["work", "shortBreak", "longBreak"],
      required: true,
    },
    durationSeconds: { type: Number, required: true, min: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false, minimize: false }
);

pomodoroCycleSchema.index({ sessionId: 1, cycleIndex: 1 });
pomodoroCycleSchema.index({ ownerId: 1, completedAt: -1 });

export type PomodoroCycleDoc = InferSchemaType<typeof pomodoroCycleSchema> & {
  _id: Types.ObjectId;
};

export const PomodoroCycle: Model<PomodoroCycleDoc> =
  (mongoose.models.PomodoroCycle as Model<PomodoroCycleDoc>) ??
  mongoose.model<PomodoroCycleDoc>("PomodoroCycle", pomodoroCycleSchema);

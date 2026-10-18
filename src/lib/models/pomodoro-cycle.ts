import mongoose, { type InferSchemaType, type Model, type Types } from "mongoose";

const pomodoroCycleSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    cycleIndex: { type: Number, required: true },
    phase: {
      type: String,
      enum: ["work", "shortBreak", "longBreak"],
      required: true,
    },
    durationSeconds: { type: Number, required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

pomodoroCycleSchema.index({ sessionId: 1, cycleIndex: 1 });

export type PomodoroCycleDoc = InferSchemaType<typeof pomodoroCycleSchema> & {
  _id: Types.ObjectId;
};

export const PomodoroCycle: Model<PomodoroCycleDoc> =
  (mongoose.models.PomodoroCycle as Model<PomodoroCycleDoc>) ??
  mongoose.model<PomodoroCycleDoc>("PomodoroCycle", pomodoroCycleSchema);

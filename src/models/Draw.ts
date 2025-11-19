import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDraw extends Document {
  entry: Types.ObjectId;
  resultLabel: string;
  drawnBy: Types.ObjectId;
  cycleIndex: number;
  drawnAt: Date;
}

const drawSchema = new Schema<IDraw>(
  {
    entry: { type: Schema.Types.ObjectId, ref: "WheelEntry", required: true },
    resultLabel: { type: String, required: true },
    drawnBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cycleIndex: { type: Number, required: true },
  },
  { timestamps: { createdAt: "drawnAt", updatedAt: false } }
);

export const DrawModel = mongoose.model<IDraw>("Draw", drawSchema);


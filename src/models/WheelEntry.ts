import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWheelEntry extends Document {
  label: string;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

const wheelEntrySchema = new Schema<IWheelEntry>(
  {
    label: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const WheelEntryModel = mongoose.model<IWheelEntry>(
  "WheelEntry",
  wheelEntrySchema
);


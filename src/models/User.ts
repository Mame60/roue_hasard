import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "admin" | "user";

export interface IUser extends Document {
  name: string;
  email: string;
  role: UserRole;
  accessCode: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    role: {
      type: String,
      enum: ["admin", "user"],
      required: true,
      default: "user",
    },
    accessCode: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);


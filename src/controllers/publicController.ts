import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { DrawModel } from "../models/Draw";
import { WheelEntryModel } from "../models/WheelEntry";
import { UserModel } from "../models/User";
import { AppError } from "../errors/AppError";

const loginSchema = z.object({
  email: z.string().email().min(1),
  accessCode: z.string().min(1),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const payload = loginSchema.parse({
    email: req.body.email?.trim().toLowerCase(),
    accessCode: req.body.accessCode,
  });

  const user = await UserModel.findOne({ email: payload.email }).lean();
  if (!user) {
    throw new AppError("Identifiants invalides.", 401);
  }

  const isValid = await bcrypt.compare(payload.accessCode, user.accessCode);
  if (!isValid) {
    throw new AppError("Identifiants invalides.", 401);
  }

  res.json({
    message: "Connexion réussie.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const getLastDraw = asyncHandler(async (_req: Request, res: Response) => {
  const lastDraw = await DrawModel.findOne()
    .sort({ drawnAt: -1 })
    .populate("drawnBy", "name role")
    .lean();

  res.json({
    lastDraw,
    message: lastDraw
      ? "Dernier tirage retourné."
      : "Aucun tirage n'a encore été effectué.",
  });
});

export const listEntries = asyncHandler(async (_req: Request, res: Response) => {
  const entries = await WheelEntryModel.find({ isActive: true })
    .sort({ label: 1 })
    .lean();
  res.json({ entries });
});

export const listAdmins = asyncHandler(async (_req: Request, res: Response) => {
  const admins = await UserModel.find({ role: "admin" })
    .select("name role createdAt")
    .sort({ createdAt: 1 })
    .lean();

  res.json({
    admins,
    message: admins.length
      ? "Administrateurs disponibles."
      : "Aucun administrateur n'est enregistré.",
  });
});


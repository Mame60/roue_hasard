import { Request, Response } from "express";
import { z } from "zod";
import {
  addWheelEntries,
  performDraw,
  removeWheelEntry,
  updateWheelEntry,
  listUsers,
  updateUserEmail,
  updateUserName,
} from "../services/drawService";
import { asyncHandler } from "../utils/asyncHandler";

const addNamesSchema = z.object({
  adminId: z.string(),
  names: z.array(z.string()).min(1),
});

const drawSchema = z.object({
  adminId: z.string(),
});

const removeSchema = z.object({
  adminId: z.string(),
  entryId: z.string(),
});

export const addNames = asyncHandler(async (req: Request, res: Response) => {
  const payload = addNamesSchema.parse(req.body);
  const result = await addWheelEntries(payload.adminId, payload.names);
  let message = `${result.inserted} nom(s) ajouté(s) à la roue.`;
  if (result.usersCreated > 0) {
    message += ` ${result.usersCreated} utilisateur(s) créé(s).`;
  }
  res.status(201).json({
    message,
    ...result,
  });
});

export const drawName = asyncHandler(async (req: Request, res: Response) => {
  const payload = drawSchema.parse(req.body);
  const draw = await performDraw(payload.adminId);
  res.status(201).json({
    message: "Tirage effectué.",
    draw,
  });
});

export const removeName = asyncHandler(async (req: Request, res: Response) => {
  const payload = removeSchema.parse({
    adminId: req.body.adminId,
    entryId: req.params.id,
  });
  const entry = await removeWheelEntry(payload.adminId, payload.entryId);
  res.json({
    message: "Nom désactivé avec succès.",
    entry,
  });
});

const updateWheelEntrySchema = z.object({
  adminId: z.string(),
  newLabel: z.string().min(1),
});

export const updateName = asyncHandler(async (req: Request, res: Response) => {
  const payload = updateWheelEntrySchema.parse({
    adminId: req.body.adminId,
    newLabel: req.body.newLabel,
  });
  const entry = await updateWheelEntry(
    payload.adminId,
    req.params.id,
    payload.newLabel
  );
  res.json({
    message: "Nom modifié avec succès.",
    entry,
  });
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.body.adminId || req.query.adminId;
  if (!adminId || typeof adminId !== "string") {
    return res.status(400).json({ message: "adminId requis." });
  }
  const users = await listUsers(adminId);
  res.json({ users });
});

const updateUserEmailSchema = z.object({
  adminId: z.string(),
  newEmail: z.string().email(),
});

export const updateEmail = asyncHandler(async (req: Request, res: Response) => {
  const payload = updateUserEmailSchema.parse({
    adminId: req.body.adminId,
    newEmail: req.body.newEmail,
  });
  const user = await updateUserEmail(
    payload.adminId,
    req.params.id,
    payload.newEmail
  );
  res.json({
    message: "Email modifié avec succès.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

const updateUserNameSchema = z.object({
  adminId: z.string(),
  newName: z.string().min(1),
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const payload = updateUserNameSchema.parse({
    adminId: req.body.adminId,
    newName: req.body.newName,
  });
  const user = await updateUserName(
    payload.adminId,
    req.params.id,
    payload.newName
  );
  res.json({
    message: "Nom modifié avec succès.",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});


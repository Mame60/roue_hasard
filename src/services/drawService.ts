import { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { AppError } from "../errors/AppError";
import { DrawModel } from "../models/Draw";
import { UserModel } from "../models/User";
import { WheelEntryModel } from "../models/WheelEntry";
import { env } from "../config/env";

const ensureAdmin = async (adminId: string) => {
  if (!Types.ObjectId.isValid(adminId)) {
    throw new AppError("Identifiant admin invalide.", 400);
  }

  const admin = await UserModel.findById(adminId);
  if (!admin || admin.role !== "admin") {
    throw new AppError("Seul un administrateur peut réaliser cette action.", 403);
  }

  return admin;
};

export const addWheelEntries = async (adminId: string, labels: string[]) => {
  const admin = await ensureAdmin(adminId);

  const normalized = [...new Set(labels.map((label) => label.trim()))].filter(
    (label) => label.length
  );

  if (!normalized.length) {
    throw new AppError("Aucun nom valide fourni.", 400);
  }

  const existing = await WheelEntryModel.find({
    label: { $in: normalized },
  }).lean();

  const existingLabels = new Set(existing.map((item) => item.label));

  const toInsert = normalized
    .filter((label) => !existingLabels.has(label))
    .map((label) => ({
      label,
      createdBy: admin._id,
    }));

  if (!toInsert.length) {
    throw new AppError("Tous les noms fournis existent déjà.", 400);
  }

  // Créer les entrées de la roue
  await WheelEntryModel.insertMany(toInsert);

  // Créer des utilisateurs pour chaque nom ajouté
  const hashedUserCode = await bcrypt.hash(env.defaultUserCode, 10);
  let usersCreated = 0;

  for (const entry of toInsert) {
    const email = `${entry.label.replace(/\s+/g, ".").toLowerCase()}@ibtikar-tech.com`;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await UserModel.findOne({ email });
    
    if (!existingUser) {
      // Créer un nouvel utilisateur
      await UserModel.create({
        name: entry.label,
        email: email,
        role: "user",
        accessCode: hashedUserCode,
      });
      usersCreated++;
    }
  }

  return { inserted: toInsert.length, usersCreated };
};

const computeCycleIndex = async (totalEntries: number): Promise<number> => {
  if (totalEntries === 0) {
    throw new AppError("La roue ne contient aucun nom.", 400);
  }

  const lastDraw = await DrawModel.findOne().sort({ drawnAt: -1 }).lean();
  if (!lastDraw) {
    return 1;
  }

  const drawsThisCycle = await DrawModel.countDocuments({
    cycleIndex: lastDraw.cycleIndex,
  });

  if (drawsThisCycle >= totalEntries) {
    return lastDraw.cycleIndex + 1;
  }

  return lastDraw.cycleIndex;
};

export const performDraw = async (adminId: string) => {
  const admin = await ensureAdmin(adminId);
  const activeEntries = await WheelEntryModel.find({ isActive: true }).lean();

  if (!activeEntries.length) {
    throw new AppError("Aucun nom actif n'est disponible pour le tirage.", 400);
  }

  const cycleIndex = await computeCycleIndex(activeEntries.length);
  const alreadyDrawnIds = await DrawModel.find({ cycleIndex }).distinct("entry");
  const remainingEntries = activeEntries.filter(
    (entry) => !alreadyDrawnIds.some((id) => id.equals(entry._id))
  );

  const pool = remainingEntries.length ? remainingEntries : activeEntries;

  const randomIndex = Math.floor(Math.random() * pool.length);
  const winner = pool[randomIndex];

  const draw = await DrawModel.create({
    entry: winner._id,
    resultLabel: winner.label,
    drawnBy: admin._id,
    cycleIndex: remainingEntries.length ? cycleIndex : cycleIndex + 1,
  });

  return draw;
};

export const removeWheelEntry = async (adminId: string, entryId: string) => {
  await ensureAdmin(adminId);

  if (!Types.ObjectId.isValid(entryId)) {
    throw new AppError("Identifiant d'entrée invalide.", 400);
  }

  const entry = await WheelEntryModel.findById(entryId);
  if (!entry) {
    throw new AppError("Nom introuvable.", 404);
  }

  if (!entry.isActive) {
    throw new AppError("Ce nom est déjà inactif.", 400);
  }

  entry.isActive = false;
  await entry.save();

  return entry;
};

export const updateWheelEntry = async (
  adminId: string,
  entryId: string,
  newLabel: string
) => {
  await ensureAdmin(adminId);

  if (!Types.ObjectId.isValid(entryId)) {
    throw new AppError("Identifiant d'entrée invalide.", 400);
  }

  const normalizedLabel = newLabel.trim();
  if (!normalizedLabel.length) {
    throw new AppError("Le nouveau nom ne peut pas être vide.", 400);
  }

  const entry = await WheelEntryModel.findById(entryId);
  if (!entry) {
    throw new AppError("Nom introuvable.", 404);
  }

  const existing = await WheelEntryModel.findOne({
    label: normalizedLabel,
    _id: { $ne: entryId },
  });

  if (existing) {
    throw new AppError("Ce nom existe déjà dans la roue.", 400);
  }

  entry.label = normalizedLabel;
  await entry.save();

  return entry;
};

export const listUsers = async (adminId: string) => {
  await ensureAdmin(adminId);
  const users = await UserModel.find()
    .select("name email role createdAt")
    .sort({ createdAt: 1 })
    .lean();
  return users;
};

export const updateUserEmail = async (
  adminId: string,
  userId: string,
  newEmail: string
) => {
  await ensureAdmin(adminId);

  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError("Identifiant utilisateur invalide.", 400);
  }

  const normalizedEmail = newEmail.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    throw new AppError("Email invalide.", 400);
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("Utilisateur introuvable.", 404);
  }

  const existing = await UserModel.findOne({
    email: normalizedEmail,
    _id: { $ne: userId },
  });

  if (existing) {
    throw new AppError("Cet email est déjà utilisé.", 400);
  }

  user.email = normalizedEmail;
  await user.save();

  return user;
};

export const updateUserName = async (
  adminId: string,
  userId: string,
  newName: string
) => {
  await ensureAdmin(adminId);

  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError("Identifiant utilisateur invalide.", 400);
  }

  const normalizedName = newName.trim();
  if (!normalizedName.length) {
    throw new AppError("Le nom ne peut pas être vide.", 400);
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("Utilisateur introuvable.", 404);
  }

  user.name = normalizedName;
  await user.save();

  return user;
};


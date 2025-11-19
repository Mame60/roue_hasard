import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database";
import { UserModel } from "../models/User";
import { env } from "../config/env";

const updateAllUsersPassword = async () => {
  await connectDatabase();

  console.log("🔧 Mise à jour des mots de passe de tous les utilisateurs...");

  const password = "pinkbellezza"; // Utiliser directement pinkbellezza
  const hashedPassword = await bcrypt.hash(password, 10);

  // Mettre à jour tous les utilisateurs (sauf admin)
  const result = await UserModel.updateMany(
    { role: "user" },
    { accessCode: hashedPassword }
  );

  console.log(`✅ ${result.modifiedCount} utilisateur(s) mis à jour avec le mot de passe: ${password}`);

  // Vérifier un utilisateur pour confirmer
  const testUser = await UserModel.findOne({ role: "user" }).lean();
  if (testUser) {
    const isValid = await bcrypt.compare(password, testUser.accessCode);
    console.log(`✅ Vérification: ${isValid ? "✅ VALIDE" : "❌ INVALIDE"}`);
    console.log(`📧 Exemple - Email: ${testUser.email}, Nom: ${testUser.name}`);
  }

  await mongoose.disconnect();
};

updateAllUsersPassword().catch(console.error);


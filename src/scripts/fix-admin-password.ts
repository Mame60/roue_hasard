import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database";
import { UserModel } from "../models/User";
import { env } from "../config/env";

const fixPassword = async () => {
  await connectDatabase();

  console.log("🔧 Correction du mot de passe admin...");

  const email = env.defaultAdminEmail;
  // Utiliser directement le mot de passe correct
  const password = "rh1234djiby";

  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Nouveau mot de passe: ${password}`);

  const user = await UserModel.findOne({ email });
  
  if (!user) {
    console.log(`❌ Utilisateur avec email ${email} non trouvé.`);
    await mongoose.disconnect();
    return;
  }

  console.log(`✅ Utilisateur trouvé: ${user.name}`);

  // Hasher le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Mettre à jour
  user.accessCode = hashedPassword;
  await user.save();

  console.log(`✅ Mot de passe mis à jour avec succès.`);

  // Vérifier
  const isValid = await bcrypt.compare(password, user.accessCode);
  console.log(`✅ Vérification: ${isValid ? "✅ VALIDE" : "❌ INVALIDE"}`);

  await mongoose.disconnect();
};

fixPassword().catch(console.error);


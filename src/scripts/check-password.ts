import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database";
import { UserModel } from "../models/User";
import { env } from "../config/env";

const checkPassword = async () => {
  await connectDatabase();

  console.log("🔍 Vérification du mot de passe...");

  const email = env.defaultAdminEmail;
  const password = env.defaultAdminCode;

  const user = await UserModel.findOne({ email }).lean();
  
  if (!user) {
    console.log(`❌ Utilisateur avec email ${email} non trouvé.`);
    await mongoose.disconnect();
    return;
  }

  console.log(`✅ Utilisateur trouvé: ${user.name}`);
  console.log(`📧 Email: ${user.email}`);
  console.log(`🔑 AccessCode stocké (premiers 20 chars): ${user.accessCode.substring(0, 20)}...`);
  console.log(`🔑 Longueur du hash: ${user.accessCode.length}`);

  // Vérifier si c'est un hash bcrypt (commence par $2a$, $2b$, $2y$)
  const isBcryptHash = /^\$2[ayb]\$.{56}$/.test(user.accessCode);
  console.log(`🔍 Est un hash bcrypt: ${isBcryptHash}`);

  if (isBcryptHash) {
    const isValid = await bcrypt.compare(password, user.accessCode);
    console.log(`✅ Comparaison avec "${password}": ${isValid ? "✅ VALIDE" : "❌ INVALIDE"}`);
  } else {
    console.log(`⚠️  Le mot de passe n'est pas hashé avec bcrypt.`);
    console.log(`🔧 Re-hashage du mot de passe...`);
    const hashed = await bcrypt.hash(password, 10);
    await UserModel.updateOne({ _id: user._id }, { accessCode: hashed });
    console.log(`✅ Mot de passe re-hashé et mis à jour.`);
  }

  await mongoose.disconnect();
};

checkPassword().catch(console.error);


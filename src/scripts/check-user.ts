import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database";
import { UserModel } from "../models/User";
import { env } from "../config/env";

const checkUser = async () => {
  await connectDatabase();

  console.log("🔍 Vérification de l'utilisateur...");

  const email = "emama@ibtikar-tech.com";
  const password = "pinkbellezza"; // Mot de passe standard pour tous les users

  const user = await UserModel.findOne({ email }).lean();
  
  if (!user) {
    console.log(`❌ Utilisateur avec email ${email} non trouvé.`);
    console.log(`🔧 Création de l'utilisateur...`);
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      name: "emama",
      email: email,
      role: "user",
      accessCode: hashedPassword,
    });
    
    console.log(`✅ Utilisateur créé: ${newUser.name} (${newUser.email})`);
    console.log(`🔑 Mot de passe: ${password}`);
  } else {
    console.log(`✅ Utilisateur trouvé: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Rôle: ${user.role}`);
    console.log(`🔑 AccessCode stocké (premiers 20 chars): ${user.accessCode.substring(0, 20)}...`);

    // Vérifier si c'est un hash bcrypt
    const isBcryptHash = /^\$2[ayb]\$.{56}$/.test(user.accessCode);
    console.log(`🔍 Est un hash bcrypt: ${isBcryptHash}`);

    if (isBcryptHash) {
      const isValid = await bcrypt.compare(password, user.accessCode);
      console.log(`✅ Comparaison avec "${password}": ${isValid ? "✅ VALIDE" : "❌ INVALIDE"}`);
      
      if (!isValid) {
        console.log(`🔧 Le mot de passe ne correspond pas. Mise à jour...`);
        const hashed = await bcrypt.hash(password, 10);
        await UserModel.updateOne({ _id: user._id }, { accessCode: hashed });
        console.log(`✅ Mot de passe mis à jour avec "${password}".`);
      }
    } else {
      console.log(`⚠️  Le mot de passe n'est pas hashé avec bcrypt.`);
      console.log(`🔧 Re-hashage du mot de passe...`);
      const hashed = await bcrypt.hash(password, 10);
      await UserModel.updateOne({ _id: user._id }, { accessCode: hashed });
      console.log(`✅ Mot de passe re-hashé et mis à jour avec "${password}".`);
    }
  }

  await mongoose.disconnect();
};

checkUser().catch(console.error);


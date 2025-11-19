import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { UserModel } from "../models/User";

const migrate = async () => {
  await connectDatabase();

  console.log("🔄 Démarrage de la migration...");

  try {
    // Supprimer l'ancien index unique sur name
    try {
      await UserModel.collection.dropIndex("name_1");
      console.log("✅ Index 'name_1' supprimé.");
    } catch (err: any) {
      if (err.codeName === "IndexNotFound") {
        console.log("ℹ️  Index 'name_1' n'existe pas, on continue.");
      } else {
        throw err;
      }
    }

    // Supprimer l'index email s'il existe déjà (pour éviter les conflits)
    try {
      await UserModel.collection.dropIndex("email_1");
      console.log("✅ Ancien index 'email_1' supprimé.");
    } catch (err: any) {
      if (err.codeName === "IndexNotFound") {
        console.log("ℹ️  Index 'email_1' n'existe pas, on continue.");
      } else {
        throw err;
      }
    }

    // Mettre à jour les documents existants AVANT de créer l'index
    const adminEmail = env.defaultAdminEmail;
    const adminCode = env.defaultAdminCode;
    const userCode = env.defaultUserCode;

    // Mettre à jour l'admin
    const admin = await UserModel.findOne({ name: "djiby" });
    if (admin) {
      const hashedAdminCode = await bcrypt.hash(adminCode, 10);
      admin.email = adminEmail;
      admin.accessCode = hashedAdminCode;
      await admin.save();
      console.log(`✅ Admin '${admin.name}' mis à jour avec email: ${adminEmail}`);
    }

    // Mettre à jour les utilisateurs
    const userNames = [
      "emem med moctar",
      "fatima hamdi",
      "fatimetou dah",
      "naha sidiya",
    ];

    const hashedUserCode = await bcrypt.hash(userCode, 10);

    for (const name of userNames) {
      const user = await UserModel.findOne({ name });
      if (user) {
        const email = `${name.replace(/\s+/g, ".").toLowerCase()}@ibtikar-tech.com`;
        user.email = email;
        user.accessCode = hashedUserCode;
        await user.save();
        console.log(`✅ User '${name}' mis à jour avec email: ${email}`);
      }
    }

    // Créer l'index unique sur email APRÈS avoir mis à jour tous les documents
    try {
      await UserModel.collection.createIndex({ email: 1 }, { unique: true });
      console.log("✅ Index unique sur 'email' créé.");
    } catch (err: any) {
      if (err.codeName === "IndexOptionsConflict") {
        console.log("ℹ️  Index sur 'email' existe déjà.");
      } else {
        throw err;
      }
    }

    console.log("✅ Migration terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  }
};

migrate()
  .catch((error) => {
    console.error("❌ Migration échouée", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("✅ Connexion fermée.");
  });


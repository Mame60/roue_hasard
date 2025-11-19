import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/database";
import { env } from "../config/env";
import { UserModel } from "../models/User";
import { WheelEntryModel } from "../models/WheelEntry";

const adminName = "djiby";
const adminEmail = env.defaultAdminEmail;

const userNames = [
  "emem med moctar",
  "fatima hamdi",
  "fatimetou dah",
  "naha sidiya",
];

const seed = async () => {
  await connectDatabase();

  console.log("✨ Démarrage du script de seed...");

  const adminAccessHash = await bcrypt.hash(env.defaultAdminCode, 10);
  const userAccessHash = await bcrypt.hash(env.defaultUserCode, 10);

  const admin = await UserModel.findOneAndUpdate(
    { email: adminEmail },
    {
      name: adminName,
      email: adminEmail,
      role: "admin",
      accessCode: adminAccessHash,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`👑 Admin prêt: ${admin.name} (${admin.email})`);

  for (const name of userNames) {
    const email = `${name.replace(/\s+/g, ".").toLowerCase()}@ibtikar-tech.com`;
    await UserModel.findOneAndUpdate(
      { email },
      {
        name,
        email,
        role: "user",
        accessCode: userAccessHash,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`👥 Utilisateurs synchronisés (${userNames.length}).`);

  for (const label of userNames) {
    await WheelEntryModel.findOneAndUpdate(
      { label },
      { label, createdBy: admin._id, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log("🎯 Entrées de la roue prêtes.");
};

seed()
  .catch((error) => {
    console.error("❌ Seed échoué", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("✅ Seed terminé. Connexion fermée.");
  });


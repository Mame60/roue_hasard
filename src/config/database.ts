import mongoose from "mongoose";
import { env } from "./env";

let cachedConnection: typeof mongoose | null = null;

export const connectDatabase = async (): Promise<typeof mongoose> => {
  // Réutiliser la connexion existante si elle existe
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedConnection = connection;
    console.log("✅ Connexion MongoDB réussie");
    return connection;
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB", error);
    // Ne pas faire process.exit() sur Vercel
    throw error;
  }
};


import { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/database";

let app: any = null;
let dbConnected = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Connecter à la base de données une seule fois
  if (!dbConnected) {
    try {
      await connectDatabase();
      dbConnected = true;
    } catch (error) {
      console.error("Erreur de connexion MongoDB:", error);
      return res.status(500).json({ message: "Erreur de connexion à la base de données" });
    }
  }

  // Créer l'app Express si elle n'existe pas encore
  if (!app) {
    app = createApp();
  }

  // Wrapper pour convertir VercelRequest/Response en Express Request/Response
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}


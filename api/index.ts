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

  // Adapter les routes : Vercel route /api/admin/... vers cette fonction
  // On doit ajuster l'URL pour que Express puisse router correctement
  const originalUrl = req.url || req.originalUrl || "";
  // Si l'URL commence par /api, on l'enlève car les routes Express sont /admin et /public
  const path = originalUrl.startsWith("/api") 
    ? originalUrl.replace(/^\/api/, "") 
    : originalUrl;
  req.url = path || "/";
  req.originalUrl = path || "/";

  // Passer la requête à Express
  return new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}


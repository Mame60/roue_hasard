import { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/database";

let app: any = null;
let dbConnected = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Endpoint de test simple
  if (req.url === "/test" || req.url === "/api/test") {
    return res.json({ message: "API fonctionne!", url: req.url });
  }

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

  // Vercel passe l'URL sans le préfixe /api
  // Par exemple: /api/admin/wheel devient /admin/wheel dans req.url
  // Mais on doit aussi gérer le cas où l'URL complète est passée
  const url = req.url || "";
  const path = url.startsWith("/api") ? url.replace(/^\/api/, "") : url;
  
  // Créer une copie modifiée de la requête pour Express
  const expressReq = {
    ...req,
    url: path || "/",
    originalUrl: path || "/",
    path: path || "/",
  } as any;

  // Passer la requête à Express
  return new Promise<void>((resolve, reject) => {
    app(expressReq, res as any, (err: any) => {
      if (err) {
        console.error("Erreur Express:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}


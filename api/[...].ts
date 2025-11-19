import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/database";

let app: express.Application | null = null;
let dbConnected = false;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Extraire le chemin de la route
  const routeParams = (req.query as any)?.['...'];
  let path = "/";
  
  if (routeParams && Array.isArray(routeParams)) {
    path = `/${routeParams.join('/')}`;
  } else if (req.url) {
    // Enlever /api du début si présent
    path = req.url.startsWith("/api") ? req.url.replace(/^\/api/, "") : req.url;
  }

  // Endpoint de test pour vérifier que la fonction est appelée
  const cleanPath = path.replace(/^\//, "");
  if (cleanPath === "test" || cleanPath === "health") {
    return res.json({ 
      message: "API fonctionne!", 
      path: cleanPath,
      query: req.query,
      url: req.url,
      method: req.method
    });
  }

  // Connecter à la base de données une seule fois
  if (!dbConnected) {
    try {
      await connectDatabase();
      dbConnected = true;
    } catch (error) {
      console.error("Erreur de connexion MongoDB:", error);
      res.status(500).json({ message: "Erreur de connexion à la base de données" });
      return;
    }
  }

  // Créer l'app Express si elle n'existe pas encore
  if (!app) {
    app = createApp();
  }

  // Utiliser le path déjà extrait plus haut
  // S'assurer que le chemin commence par /
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  // Modifier l'URL de la requête pour Express
  const modifiedReq = Object.assign({}, req, {
    url: path,
    originalUrl: path,
    path: path,
  }) as any;

  // Utiliser app.handle() pour traiter la requête
  return new Promise<void>((resolve) => {
    const responseEnded = { value: false };
    
    // Intercepter res.end pour savoir quand la réponse est terminée
    const originalEnd = res.end.bind(res);
    res.end = function(...args: any[]) {
      responseEnded.value = true;
      return originalEnd(...args);
    };

    app!.handle(modifiedReq, res as any, (err: any) => {
      if (err && !responseEnded.value) {
        console.error("Erreur Express:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Erreur serveur", error: err.message });
        }
      }
      resolve();
    });
  });
}


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
  // Endpoint de test pour vérifier que la fonction est appelée
  const routeParams = (req.query as any)?.['...'];
  const testPath = routeParams && Array.isArray(routeParams) 
    ? routeParams.join('/') 
    : (req.url || "").replace(/^\/api\//, "");
  
  if (testPath === "test" || testPath === "health") {
    return res.json({ 
      message: "API fonctionne!", 
      path: testPath,
      query: req.query,
      url: req.url 
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

  // Vercel route /api/* vers cette fonction avec catch-all [...]
  // req.query contient les paramètres de route dans la clé '...'
  // Par exemple: /api/admin/wheel → req.query = { '...': ['admin', 'wheel'] }
  const routeParams = (req.query as any)?.['...'];
  let path = "/";
  
  if (routeParams && Array.isArray(routeParams)) {
    path = `/${routeParams.join('/')}`;
  } else if (req.url) {
    // Fallback si req.url est disponible
    path = req.url.startsWith("/api") ? req.url.replace(/^\/api/, "") : req.url;
  }

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


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
    res.json({ 
      message: "API fonctionne!", 
      path: cleanPath,
      query: req.query,
      url: req.url,
      method: req.method
    });
    return;
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

  // Créer une requête Express compatible
  const expressReq = {
    ...req,
    url: path,
    originalUrl: path,
    path: path,
    method: req.method || "GET",
    headers: req.headers || {},
    body: req.body,
    query: req.query || {},
    params: {},
  } as any;

  // Créer une réponse Express compatible
  const expressRes = res as any;

  // Utiliser app comme fonction (Express Application est callable)
  return new Promise<void>((resolve) => {
    let finished = false;

    // Intercepter la fin de la réponse
    const originalEnd = expressRes.end.bind(expressRes);
    expressRes.end = function(...args: any[]) {
      if (!finished) {
        finished = true;
        resolve();
      }
      return originalEnd(...args);
    };

    // Appeler l'app Express
    try {
      (app as any)(expressReq, expressRes, (err: any) => {
        if (err) {
          console.error("Erreur Express:", err);
          if (!finished && !expressRes.headersSent) {
            finished = true;
            expressRes.status(500).json({ message: "Erreur serveur", error: err.message });
            resolve();
          }
        } else if (!finished) {
          // Timeout de sécurité
          setTimeout(() => {
            if (!finished) {
              finished = true;
              resolve();
            }
          }, 1000);
        }
      });
    } catch (error) {
      console.error("Erreur lors de l'appel Express:", error);
      if (!finished) {
        finished = true;
        expressRes.status(500).json({ message: "Erreur serveur", error: String(error) });
        resolve();
      }
    }
  });
}


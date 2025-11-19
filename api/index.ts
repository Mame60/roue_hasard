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

  // Vercel route /api/* vers cette fonction, donc req.url contient déjà le chemin sans /api
  // Par exemple: /api/admin/wheel → req.url = /admin/wheel
  const originalUrl = req.url || "";
  const path = originalUrl.startsWith("/api") 
    ? originalUrl.replace(/^\/api/, "") 
    : originalUrl;

  // Modifier l'URL de la requête pour Express
  const modifiedReq = Object.assign(req, {
    url: path || "/",
    originalUrl: path || "/",
  });

  // Utiliser app.handle() pour traiter la requête
  return new Promise<void>((resolve) => {
    app!.handle(modifiedReq as any, res as any, () => {
      resolve();
    });
  });
}


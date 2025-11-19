import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error("Erreur inattendue:", err);
  return res
    .status(500)
    .json({ message: "Une erreur inattendue est survenue." });
};


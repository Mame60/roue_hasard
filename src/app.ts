import express from "express";
import cors from "cors";
import morgan from "morgan";
import adminRoutes from "./routes/adminRoutes";
import publicRoutes from "./routes/publicRoutes";
import { errorHandler } from "./middleware/errorHandler";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/admin", adminRoutes);
  app.use("/api/public", publicRoutes);

  app.use(errorHandler);

  return app;
};


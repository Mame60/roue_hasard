import dotenv from "dotenv";

dotenv.config();

const requiredVars = ["MONGODB_URI", "PORT"];

requiredVars.forEach((name) => {
  if (!process.env[name]) {
    throw new Error(`La variable d'environnement ${name} est manquante.`);
    }
});

export const env = {
  mongodbUri: process.env.MONGODB_URI as string,
  port: Number(process.env.PORT) || 4000,
  defaultAdminName: process.env.DEFAULT_ADMIN_NAME || "djiby",
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || "djiby@ibtikar-tech.com",
  defaultAdminCode: process.env.DEFAULT_ADMIN_CODE || "admin123",
  defaultUserCode: process.env.DEFAULT_USER_CODE || "pinkbellezza",
};


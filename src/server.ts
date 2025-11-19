import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

const bootstrap = async () => {
  await connectDatabase();
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`🚀 Serveur démarré sur le port ${env.port}`);
  });
};

bootstrap();


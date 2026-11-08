import "dotenv/config";
import { loadConfig } from "./config.js";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  const config = loadConfig();
  const app = createApp(config);

  const server = app.listen(config.PORT, () => {
    console.log(`MealMate API listening on http://localhost:${config.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

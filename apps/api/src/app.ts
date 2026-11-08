import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { AppConfig } from "./config.js";
import { createAdminRouter } from "./routes/admin/index.js";
import { createPartnerRouter } from "./routes/partner/index.js";
import { createCustomerRouter } from "./routes/customer/index.js";
import { createAuthRouter } from "./routes/auth.js";

export function createApp(config: AppConfig) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/v1/auth", createAuthRouter(config));
  app.use("/v1/admin", createAdminRouter(config));
  app.use("/v1/partner", createPartnerRouter(config));
  app.use("/v1/customer", createCustomerRouter(config));

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
  });

  return app;
}

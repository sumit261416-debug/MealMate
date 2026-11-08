import { Router } from "express";
import type { AppConfig } from "../../config.js";
import { createRequirePartner } from "../../middleware/partner.js";
import { createPartnerDashboardRouter } from "./dashboard.js";
import { createPartnerOrdersRouter } from "./orders.js";
import { createPartnerMenuRouter } from "./menu.js";
import { createPartnerSubscriptionsRouter } from "./subscriptions.js";
import { createPartnerPayoutsRouter } from "./payouts.js";
import { createPartnerProfileRouter } from "./profile.js";

export function createPartnerRouter(config: AppConfig): Router {
  const router = Router();
  const requirePartner = createRequirePartner(config);

  // All partner routes strictly require authenticated kitchen_partner session
  router.use(requirePartner);

  router.use("/dashboard", createPartnerDashboardRouter());
  router.use("/orders", createPartnerOrdersRouter());
  router.use("/menu", createPartnerMenuRouter());
  router.use("/subscriptions", createPartnerSubscriptionsRouter());
  router.use("/payouts", createPartnerPayoutsRouter());
  router.use("/profile", createPartnerProfileRouter());

  return router;
}

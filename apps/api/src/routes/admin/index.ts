import { Router } from "express";
import type { AppConfig } from "../../config.js";
import { createRequireAuth, requireRoles } from "../../middleware/auth.js";
import { createDashboardRouter } from "./dashboard.js";
import { createPartnersRouter } from "./partners.js";
import { createCustomersRouter } from "./customers.js";
import { createMenusRouter } from "./menus.js";
import { createOrdersRouter } from "./orders.js";
import { createServiceConfigRouter } from "./service-config.js";
import { createSupportRouter } from "./support.js";
import { createAuditRouter } from "./audit.js";
import { createRefundsRouter } from "./refunds.js";
import { createDeliveriesRouter } from "./deliveries.js";
import { createPaymentsRouter } from "./payments.js";
import { createDocumentsRouter } from "./documents.js";

export function createAdminRouter(config: AppConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(config);

  router.use(requireAuth, requireRoles("admin"));

  router.use("/dashboard", createDashboardRouter());
  router.use("/partners", createPartnersRouter(config));
  router.use("/customers", createCustomersRouter());
  router.use("/menus", createMenusRouter());
  router.use("/orders", createOrdersRouter());
  router.use("/service-config", createServiceConfigRouter());
  router.use("/support", createSupportRouter());
  router.use("/audit", createAuditRouter());
  router.use("/refunds", createRefundsRouter());
  router.use("/deliveries", createDeliveriesRouter());
  router.use("/payments", createPaymentsRouter());
  router.use("/documents", createDocumentsRouter(config));

  return router;
}

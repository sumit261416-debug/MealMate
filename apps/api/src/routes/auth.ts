import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import { writeAuditLog } from "../lib/audit.js";
import { AppError, sendError } from "../lib/errors.js";
import { verifyPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../lib/tokens.js";
import { createRequireAuth } from "../middleware/auth.js";

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export function createAuthRouter(config: AppConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(config);

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts", code: "RATE_LIMITED" },
  });

  router.post("/login", loginLimiter, async (req, res) => {
    try {
      const body = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
        include: { roles: true },
      });

      // Generic failure — avoid account enumeration
      const invalid = new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");

      if (!user?.passwordHash || !user.isActive) {
        throw invalid;
      }

      const passwordOk = await verifyPassword(user.passwordHash, body.password);
      if (!passwordOk) {
        throw invalid;
      }

      const roles = user.roles.map((r) => r.role);
      const isAllowed = roles.includes("admin") || roles.includes("kitchen_partner") || roles.includes("customer");
      if (!isAllowed) {
        throw invalid;
      }

      let partnerInfo = null;
      if (roles.includes("kitchen_partner")) {
        const partner = await prisma.kitchenPartner.findUnique({
          where: { userId: user.id },
          select: { id: true, businessName: true, status: true },
        });
        if (!partner) {
          throw new AppError(403, "No kitchen partner profile found for this account", "NO_PARTNER_PROFILE");
        }
        if (partner.status === "suspended") {
          throw new AppError(403, "Your kitchen partner account is currently suspended. Please contact operations support.", "ACCOUNT_SUSPENDED");
        }
        partnerInfo = partner;
      }

      const audience = roles.includes("admin")
        ? "mealmate-admin"
        : roles.includes("kitchen_partner")
        ? "mealmate-partner"
        : "mealmate-customer";

      const accessToken = await signAccessToken(
        { sub: user.id, roles, email: user.email },
        config.JWT_SECRET,
        "30d",
        audience,
      );

      await writeAuditLog({
        actorId: user.id,
        action: roles.includes("admin") ? "admin.login" : roles.includes("kitchen_partner") ? "partner.login" : "customer.login",
        entityType: "user",
        entityId: user.id,
        ip: req.ip,
      });

      res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roles,
        },
        partner: partnerInfo,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/me", requireAuth, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.authUser!.id },
        include: {
          roles: true,
          kitchenPartner: {
            select: { id: true, businessName: true, status: true },
          },
        },
      });
      if (!user) {
        throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
      }
      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles.map((r) => r.role),
        partner: user.kitchenPartner ?? null,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

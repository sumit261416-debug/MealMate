import type { NextFunction, Request, Response } from "express";
import type { KitchenPartner } from "@prisma/client";
import type { AppConfig } from "../config.js";
import { AppError, sendError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { createRequireAuth } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      authPartner?: KitchenPartner;
    }
  }
}

/**
 * Enforces kitchen partner authentication:
 * 1. Validates JWT access token
 * 2. Checks role includes 'kitchen_partner'
 * 3. Resolves and attaches the authenticated KitchenPartner entity
 * 4. Fails closed if partner is missing or suspended
 */
export function createRequirePartner(config: AppConfig) {
  const requireAuth = createRequireAuth(config);

  return async (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, async () => {
      try {
        const user = req.authUser;
        if (!user || !user.roles.includes("kitchen_partner")) {
          throw new AppError(403, "Kitchen partner credentials required", "FORBIDDEN");
        }

        const partner = await prisma.kitchenPartner.findUnique({
          where: { userId: user.id },
        });

        if (!partner) {
          throw new AppError(403, "No kitchen partner profile found for this account", "NO_PARTNER_PROFILE");
        }

        if (partner.status === "suspended") {
          throw new AppError(
            403,
            "Your kitchen partner account is suspended. Please contact operations.",
            "ACCOUNT_SUSPENDED",
          );
        }

        req.authPartner = partner;
        next();
      } catch (error) {
        sendError(res, error);
      }
    });
  };
}

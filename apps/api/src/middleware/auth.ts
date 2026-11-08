import type { NextFunction, Request, Response } from "express";
import type { RoleName } from "@prisma/client";
import type { AppConfig } from "../config.js";
import { AppError, sendError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/tokens.js";

export type AuthUser = {
  id: string;
  email: string | null;
  roles: RoleName[];
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      config?: AppConfig;
    }
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export function createRequireAuth(config: AppConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractBearer(req);
      if (!token) {
        throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
      }

      const payload = await verifyAccessToken(token, config.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { roles: true },
      });

      if (!user || !user.isActive) {
        throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
      }

      const roles = user.roles.map((r) => r.role);
      req.authUser = {
        id: user.id,
        email: user.email,
        roles,
      };
      next();
    } catch (error) {
      if (error instanceof AppError) {
        sendError(res, error);
        return;
      }
      sendError(res, new AppError(401, "Invalid or expired session", "UNAUTHENTICATED"));
    }
  };
}

export function requireRoles(...allowed: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.authUser;
      if (!user) {
        throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
      }
      const ok = allowed.some((role) => user.roles.includes(role));
      if (!ok) {
        throw new AppError(403, "Insufficient permissions", "FORBIDDEN");
      }
      next();
    } catch (error) {
      sendError(res, error);
    }
  };
}

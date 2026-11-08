import { Router } from "express";
import { z } from "zod";
import { sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

const listSchema = z.object({
  entityType: z.string().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export function createAuditRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const query = listSchema.parse(req.query);
      const where = {
        ...(query.entityType ? { entityType: query.entityType } : {}),
      };

      const [total, items] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          include: {
            actor: { select: { id: true, email: true, fullName: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
      ]);

      res.json({ page: query.page, pageSize: query.pageSize, total, items });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

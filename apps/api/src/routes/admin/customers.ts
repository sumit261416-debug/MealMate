import { Router } from "express";
import { z } from "zod";
import { sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

const listSchema = z.object({
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export function createCustomersRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const query = listSchema.parse(req.query);
      const where = {
        roles: { some: { role: "customer" as const } },
        ...(query.q
          ? {
              OR: [
                { email: { contains: query.q, mode: "insensitive" as const } },
                { phone: { contains: query.q } },
                { fullName: { contains: query.q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

      const [total, items] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            phone: true,
            fullName: true,
            isActive: true,
            createdAt: true,
            _count: { select: { orders: true, addresses: true } },
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

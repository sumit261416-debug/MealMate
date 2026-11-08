import { PaymentStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

const listSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export function createPaymentsRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const query = listSchema.parse(req.query);
      const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                { id: { contains: query.q } },
                { providerRef: { contains: query.q } },
                { orderId: { contains: query.q } },
              ],
            }
          : {}),
      };

      const [total, items, grouped] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where,
          include: {
            order: {
              select: {
                id: true,
                status: true,
                totalPaise: true,
                customer: { select: { email: true, fullName: true } },
              },
            },
            refunds: {
              select: { id: true, status: true, amountPaise: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        prisma.payment.groupBy({
          by: ["status"],
          _sum: { amountPaise: true },
          _count: { _all: true },
        }),
      ]);

      res.json({
        page: query.page,
        pageSize: query.pageSize,
        total,
        items,
        summary: grouped.map((row) => ({
          status: row.status,
          count: row._count._all,
          amountPaise: row._sum.amountPaise ?? 0,
        })),
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

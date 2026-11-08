import { OrderStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { sendError, AppError } from "../../lib/errors.js";
import {
  allowedAdminTransitions,
  canAdminTransition,
} from "../../lib/order-transitions.js";
import { prisma } from "../../lib/prisma.js";

const listSchema = z.object({
  q: z.string().max(100).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
});

export function createOrdersRouter(): Router {
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
                {
                  customer: {
                    email: { contains: query.q, mode: "insensitive" as const },
                  },
                },
                {
                  partner: {
                    businessName: {
                      contains: query.q,
                      mode: "insensitive" as const,
                    },
                  },
                },
              ],
            }
          : {}),
      };

      const [total, items] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          select: {
            id: true,
            status: true,
            totalPaise: true,
            deliveryDate: true,
            createdAt: true,
            customer: {
              select: { id: true, email: true, fullName: true, phone: true },
            },
            partner: { select: { id: true, businessName: true } },
            mealSlot: { select: { code: true, displayName: true } },
            serviceArea: { select: { name: true, code: true } },
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

  router.get("/:id", async (req, res) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          customer: {
            select: { id: true, email: true, fullName: true, phone: true },
          },
          partner: { select: { id: true, businessName: true, status: true } },
          address: true,
          mealSlot: true,
          serviceArea: true,
          items: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
          payments: {
            select: {
              id: true,
              status: true,
              amountPaise: true,
              currency: true,
              provider: true,
              providerRef: true,
              createdAt: true,
            },
          },
          deliveryTask: true,
        },
      });
      if (!order) {
        throw new AppError(404, "Order not found", "NOT_FOUND");
      }
      res.json({
        ...order,
        allowedTransitions: allowedAdminTransitions(order.status),
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.patch("/:id/status", async (req, res) => {
    try {
      const body = statusSchema.parse(req.body);
      const existing = await prisma.order.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        throw new AppError(404, "Order not found", "NOT_FOUND");
      }
      if (!canAdminTransition(existing.status, body.status)) {
        throw new AppError(
          400,
          `Cannot move order from ${existing.status} to ${body.status}`,
          "INVALID_TRANSITION",
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: existing.id },
          data: { status: body.status },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: existing.status,
            toStatus: body.status,
            note: body.note?.trim() || "admin override",
            actorId: req.authUser!.id,
          },
        });
        return order;
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "order.status_override",
        entityType: "order",
        entityId: updated.id,
        metadata: { from: existing.status, to: body.status },
        ip: req.ip,
      });

      res.json({
        ...updated,
        allowedTransitions: allowedAdminTransitions(updated.status),
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

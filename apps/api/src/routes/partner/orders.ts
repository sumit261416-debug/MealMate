import { OrderStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError, sendError } from "../../lib/errors.js";
import {
  allowedKitchenTransitions,
  canKitchenTransition,
} from "../../lib/order-transitions.js";
import { prisma } from "../../lib/prisma.js";

const listSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  slot: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const statusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(250).optional(),
});

export function createPartnerOrdersRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;
      const query = listSchema.parse(req.query);

      const where = {
        partnerId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.slot ? { mealSlot: { code: query.slot as any } } : {}),
      };

      const [total, items] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          include: {
            items: true,
            mealSlot: { select: { code: true, displayName: true } },
            address: {
              select: {
                label: true,
                pgName: true,
                roomFlat: true,
                line1: true,
                landmark: true,
                instructions: true,
              },
            },
            deliveryTask: {
              select: { assigneeName: true, status: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
      ]);

      const formatted = items.map((o) => ({
        ...o,
        allowedTransitions: allowedKitchenTransitions(o.status),
      }));

      res.json({
        page: query.page,
        pageSize: query.pageSize,
        total,
        items: formatted,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;
      const order = await prisma.order.findFirst({
        where: { id: req.params.id, partnerId },
        include: {
          items: true,
          mealSlot: true,
          address: true,
          deliveryTask: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!order) {
        throw new AppError(404, "Order not found", "NOT_FOUND");
      }

      res.json({
        ...order,
        allowedTransitions: allowedKitchenTransitions(order.status),
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.patch("/:id/status", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;
      const body = statusSchema.parse(req.body);

      const existing = await prisma.order.findFirst({
        where: { id: req.params.id, partnerId },
      });

      if (!existing) {
        throw new AppError(404, "Order not found", "NOT_FOUND");
      }

      if (!canKitchenTransition(existing.status, body.status)) {
        throw new AppError(
          400,
          `Kitchen cannot transition order from '${existing.status}' to '${body.status}'. Allowed: ${allowedKitchenTransitions(existing.status).join(", ") || "none"}`,
          "INVALID_KITCHEN_TRANSITION",
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
            note: body.note?.trim() || `Kitchen ${body.status}`,
            actorId: req.authUser!.id,
          },
        });

        return order;
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: `partner.order.${body.status}`,
        entityType: "order",
        entityId: updated.id,
        metadata: {
          partnerId,
          from: existing.status,
          to: updated.status,
        },
        ip: req.ip,
      });

      res.json({
        ...updated,
        allowedTransitions: allowedKitchenTransitions(updated.status),
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

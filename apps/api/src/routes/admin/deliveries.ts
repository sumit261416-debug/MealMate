import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError, sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

const listSchema = z.object({
  status: z.string().max(40).optional(),
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const assignSchema = z.object({
  assigneeName: z.string().min(2).max(120),
  status: z
    .enum(["assigned", "picked_up", "delivered", "failed", "unassigned"])
    .optional(),
  podNote: z.string().max(500).optional(),
});

const createSchema = z.object({
  orderId: z.string().cuid(),
  assigneeName: z.string().min(2).max(120).optional(),
});

export function createDeliveriesRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const query = listSchema.parse(req.query);
      const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                { assigneeName: { contains: query.q, mode: "insensitive" as const } },
                { orderId: { contains: query.q } },
                {
                  order: {
                    partner: {
                      businessName: {
                        contains: query.q,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      };

      const [total, items] = await Promise.all([
        prisma.deliveryTask.count({ where }),
        prisma.deliveryTask.findMany({
          where,
          include: {
            order: {
              select: {
                id: true,
                status: true,
                totalPaise: true,
                deliveryDate: true,
                customer: {
                  select: { fullName: true, phone: true, email: true },
                },
                partner: { select: { businessName: true } },
                mealSlot: { select: { displayName: true, code: true } },
                address: {
                  select: {
                    line1: true,
                    pgName: true,
                    roomFlat: true,
                    landmark: true,
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
      ]);

      res.json({ page: query.page, pageSize: query.pageSize, total, items });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/", async (req, res) => {
    try {
      const body = createSchema.parse(req.body);
      const order = await prisma.order.findUnique({ where: { id: body.orderId } });
      if (!order) {
        throw new AppError(404, "Order not found", "NOT_FOUND");
      }

      const existing = await prisma.deliveryTask.findUnique({
        where: { orderId: body.orderId },
      });
      if (existing) {
        throw new AppError(409, "Delivery task already exists", "CONFLICT");
      }

      const created = await prisma.deliveryTask.create({
        data: {
          orderId: body.orderId,
          assigneeName: body.assigneeName ?? null,
          status: body.assigneeName ? "assigned" : "unassigned",
        },
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "delivery.create",
        entityType: "delivery_task",
        entityId: created.id,
        metadata: { orderId: body.orderId },
        ip: req.ip,
      });

      res.status(201).json(created);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const body = assignSchema.parse(req.body);
      const existing = await prisma.deliveryTask.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        throw new AppError(404, "Delivery task not found", "NOT_FOUND");
      }

      const updated = await prisma.deliveryTask.update({
        where: { id: existing.id },
        data: {
          assigneeName: body.assigneeName,
          status: body.status ?? "assigned",
          ...(body.podNote !== undefined ? { podNote: body.podNote } : {}),
        },
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "delivery.assign",
        entityType: "delivery_task",
        entityId: updated.id,
        metadata: {
          assigneeName: updated.assigneeName,
          status: updated.status,
        },
        ip: req.ip,
      });

      res.json(updated);
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

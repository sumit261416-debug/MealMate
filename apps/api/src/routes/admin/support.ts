import { TicketPriority, TicketStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError, sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

const listSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const updateSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
});

export function createSupportRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const query = listSchema.parse(req.query);
      const where = {
        ...(query.status ? { status: query.status } : {}),
      };

      const [total, items] = await Promise.all([
        prisma.supportTicket.count({ where }),
        prisma.supportTicket.findMany({
          where,
          include: {
            requester: {
              select: { id: true, email: true, fullName: true, phone: true },
            },
            assignee: { select: { id: true, email: true, fullName: true } },
            order: { select: { id: true, status: true } },
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

  router.patch("/:id", async (req, res) => {
    try {
      const body = updateSchema.parse(req.body);
      const existing = await prisma.supportTicket.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        throw new AppError(404, "Ticket not found", "NOT_FOUND");
      }

      const updated = await prisma.supportTicket.update({
        where: { id: existing.id },
        data: {
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.priority !== undefined ? { priority: body.priority } : {}),
          ...(body.assigneeId !== undefined
            ? { assigneeId: body.assigneeId }
            : {}),
        },
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "support_ticket.update",
        entityType: "support_ticket",
        entityId: updated.id,
        metadata: body,
        ip: req.ip,
      });

      res.json(updated);
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

import { RefundStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError, sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

const listSchema = z.object({
  status: z.nativeEnum(RefundStatus).optional(),
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const decideSchema = z.object({
  decision: z.enum(["approved", "rejected", "processed"]),
  decisionNote: z.string().max(500).optional(),
});

export function createRefundsRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const query = listSchema.parse(req.query);
      const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                { orderId: { contains: query.q } },
                { reason: { contains: query.q, mode: "insensitive" as const } },
                { id: { contains: query.q } },
              ],
            }
          : {}),
      };

      const [total, items] = await Promise.all([
        prisma.refund.count({ where }),
        prisma.refund.findMany({
          where,
          include: {
            payment: {
              select: {
                id: true,
                amountPaise: true,
                status: true,
                provider: true,
                providerRef: true,
                order: {
                  select: {
                    id: true,
                    status: true,
                    totalPaise: true,
                    customer: {
                      select: { id: true, email: true, fullName: true },
                    },
                  },
                },
              },
            },
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

  router.patch("/:id/decision", async (req, res) => {
    try {
      const body = decideSchema.parse(req.body);
      const refund = await prisma.refund.findUnique({
        where: { id: req.params.id },
        include: { payment: true },
      });
      if (!refund) {
        throw new AppError(404, "Refund not found", "NOT_FOUND");
      }

      if (body.decision === "approved" && refund.status !== "requested") {
        throw new AppError(400, "Only requested refunds can be approved", "INVALID_STATE");
      }
      if (body.decision === "rejected" && refund.status !== "requested") {
        throw new AppError(400, "Only requested refunds can be rejected", "INVALID_STATE");
      }
      if (
        body.decision === "processed" &&
        refund.status !== "approved" &&
        refund.status !== "requested"
      ) {
        throw new AppError(
          400,
          "Only approved/requested refunds can be marked processed",
          "INVALID_STATE",
        );
      }
      if (body.decision === "rejected" && !body.decisionNote?.trim()) {
        throw new AppError(400, "Rejection note is required", "VALIDATION_ERROR");
      }

      const updated = await prisma.$transaction(async (tx) => {
        const next = await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: body.decision,
            decisionNote: body.decisionNote?.trim() || null,
            decidedById: req.authUser!.id,
            decidedAt: new Date(),
          },
        });

        if (body.decision === "approved" || body.decision === "processed") {
          const paymentStatus =
            body.decision === "processed"
              ? refund.amountPaise >= refund.payment.amountPaise
                ? "refunded"
                : "partially_refunded"
              : "refund_pending";
          await tx.payment.update({
            where: { id: refund.paymentId },
            data: { status: paymentStatus },
          });
        }

        return next;
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: `refund.${body.decision}`,
        entityType: "refund",
        entityId: updated.id,
        metadata: {
          from: refund.status,
          to: updated.status,
          amountPaise: refund.amountPaise,
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

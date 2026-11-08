import { PartnerStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import type { AppConfig } from "../../config.js";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError, sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { signDocumentAccessToken } from "../../lib/signed-docs.js";

const listSchema = z.object({
  q: z.string().max(100).optional(),
  status: z.nativeEnum(PartnerStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const statusSchema = z.object({
  status: z.enum([
    "under_review",
    "approved",
    "rejected",
    "suspended",
  ]),
  rejectionReason: z.string().max(500).optional(),
});

export function createPartnersRouter(config: AppConfig): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const query = listSchema.parse(req.query);
      const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                { businessName: { contains: query.q, mode: "insensitive" as const } },
                { contactEmail: { contains: query.q, mode: "insensitive" as const } },
                { contactPhone: { contains: query.q } },
              ],
            }
          : {}),
      };

      const [total, items] = await Promise.all([
        prisma.kitchenPartner.count({ where }),
        prisma.kitchenPartner.findMany({
          where,
          include: {
            user: { select: { id: true, email: true, phone: true, fullName: true } },
            serviceAreas: { include: { serviceArea: true } },
            _count: { select: { menus: true, orders: true } },
          },
          orderBy: { updatedAt: "desc" },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
      ]);

      res.json({
        page: query.page,
        pageSize: query.pageSize,
        total,
        items,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const partner = await prisma.kitchenPartner.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, email: true, phone: true, fullName: true } },
          serviceAreas: { include: { serviceArea: true } },
          menus: { include: { items: true } },
          documents: {
            select: {
              id: true,
              docType: true,
              originalName: true,
              mimeType: true,
              createdAt: true,
            },
          },
        },
      });
      if (!partner) {
        throw new AppError(404, "Partner not found", "NOT_FOUND");
      }
      res.json(partner);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/:id/documents/:docId/access", async (req, res) => {
    try {
      const doc = await prisma.partnerDocument.findFirst({
        where: { id: req.params.docId, partnerId: req.params.id },
      });
      if (!doc) {
        throw new AppError(404, "Document not found", "NOT_FOUND");
      }

      const token = await signDocumentAccessToken({
        documentId: doc.id,
        partnerId: doc.partnerId,
        actorId: req.authUser!.id,
        secret: config.JWT_SECRET,
        expiresIn: "5m",
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "partner_document.access_granted",
        entityType: "partner_document",
        entityId: doc.id,
        metadata: { partnerId: doc.partnerId, expiresIn: "5m" },
        ip: req.ip,
      });

      res.json({
        token,
        expiresInSeconds: 300,
        viewPath: `/v1/admin/documents/view?token=${encodeURIComponent(token)}`,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.patch("/:id/status", async (req, res) => {
    try {
      const body = statusSchema.parse(req.body);
      if (body.status === "rejected" && !body.rejectionReason?.trim()) {
        throw new AppError(400, "Rejection reason is required", "VALIDATION_ERROR");
      }

      const existing = await prisma.kitchenPartner.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        throw new AppError(404, "Partner not found", "NOT_FOUND");
      }

      const updated = await prisma.kitchenPartner.update({
        where: { id: existing.id },
        data: {
          status: body.status,
          rejectionReason:
            body.status === "rejected" ? body.rejectionReason!.trim() : null,
        },
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "partner.status_change",
        entityType: "kitchen_partner",
        entityId: updated.id,
        metadata: {
          from: existing.status,
          to: updated.status,
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

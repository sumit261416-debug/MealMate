import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

const updateProfileSchema = z.object({
  businessName: z.string().min(2).max(100).optional(),
  contactEmail: z.string().email().max(255).optional(),
  contactPhone: z.string().min(8).max(20).optional(),
});

export function createPartnerProfileRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;

      const partner = await prisma.kitchenPartner.findUnique({
        where: { id: partnerId },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          serviceAreas: {
            include: { serviceArea: true },
          },
          documents: {
            select: {
              id: true,
              docType: true,
              originalName: true,
              mimeType: true,
              createdAt: true,
            },
          },
          _count: {
            select: { orders: true, menus: true },
          },
        },
      });

      res.json(partner);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.patch("/", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;
      const body = updateProfileSchema.parse(req.body);

      const updated = await prisma.kitchenPartner.update({
        where: { id: partnerId },
        data: {
          ...(body.businessName ? { businessName: body.businessName.trim() } : {}),
          ...(body.contactEmail ? { contactEmail: body.contactEmail.trim().toLowerCase() } : {}),
          ...(body.contactPhone ? { contactPhone: body.contactPhone.trim() } : {}),
        },
        include: {
          serviceAreas: { include: { serviceArea: true } },
          documents: true,
        },
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "partner.profile.updated",
        entityType: "kitchen_partner",
        entityId: partnerId,
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

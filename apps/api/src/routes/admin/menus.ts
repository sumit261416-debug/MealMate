import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError, sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

const listSchema = z.object({
  q: z.string().max(100).optional(),
  published: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const publishSchema = z.object({
  isPublished: z.boolean(),
});

export function createMenusRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const query = listSchema.parse(req.query);
      const where = {
        ...(query.published === undefined
          ? {}
          : { isPublished: query.published }),
        ...(query.q
          ? {
              OR: [
                { title: { contains: query.q, mode: "insensitive" as const } },
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
        prisma.menu.count({ where }),
        prisma.menu.findMany({
          where,
          include: {
            partner: { select: { id: true, businessName: true, status: true } },
            items: true,
            _count: { select: { items: true } },
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

  router.patch("/:id/publish", async (req, res) => {
    try {
      const body = publishSchema.parse(req.body);
      const existing = await prisma.menu.findUnique({
        where: { id: req.params.id },
        include: { partner: true },
      });
      if (!existing) {
        throw new AppError(404, "Menu not found", "NOT_FOUND");
      }
      if (
        body.isPublished &&
        existing.partner.status !== "approved"
      ) {
        throw new AppError(
          400,
          "Cannot publish menu for non-approved partner",
          "INVALID_STATE",
        );
      }

      const updated = await prisma.menu.update({
        where: { id: existing.id },
        data: { isPublished: body.isPublished },
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: body.isPublished ? "menu.publish" : "menu.unpublish",
        entityType: "menu",
        entityId: updated.id,
        ip: req.ip,
      });

      res.json(updated);
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

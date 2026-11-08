import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError, sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

const createItemSchema = z.object({
  menuId: z.string().optional(),
  name: z.string().min(2).max(100),
  description: z.string().max(400).optional(),
  pricePaise: z.coerce.number().int().min(100).max(200000), // ₹1 to ₹2000
  isVeg: z.boolean().default(true),
  allergens: z.string().max(150).optional(),
  dailyCapacity: z.coerce.number().int().min(1).max(1000).optional(),
  isAvailable: z.boolean().default(true),
});

const updateItemSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(400).nullable().optional(),
  pricePaise: z.coerce.number().int().min(100).max(200000).optional(),
  isVeg: z.boolean().optional(),
  allergens: z.string().max(150).nullable().optional(),
  dailyCapacity: z.coerce.number().int().min(1).max(1000).nullable().optional(),
  isAvailable: z.boolean().optional(),
});

export function createPartnerMenuRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;

      let menus = await prisma.menu.findMany({
        where: { partnerId },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      // If partner has no menu yet, auto-initialize their primary menu
      if (menus.length === 0) {
        const newMenu = await prisma.menu.create({
          data: {
            partnerId,
            title: `${req.authPartner!.businessName} Menu`,
            isPublished: false,
          },
          include: { items: true },
        });
        menus = [newMenu];
      }

      res.json(menus);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/items", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;
      const body = createItemSchema.parse(req.body);

      // Verify or find menu belonging to this partner
      let menu = body.menuId
        ? await prisma.menu.findFirst({
            where: { id: body.menuId, partnerId },
          })
        : await prisma.menu.findFirst({
            where: { partnerId },
          });

      if (!menu) {
        menu = await prisma.menu.create({
          data: {
            partnerId,
            title: `${req.authPartner!.businessName} Daily Menu`,
            isPublished: false,
          },
        });
      }

      const item = await prisma.menuItem.create({
        data: {
          menuId: menu.id,
          name: body.name.trim(),
          description: body.description?.trim() || null,
          pricePaise: body.pricePaise,
          isVeg: body.isVeg,
          allergens: body.allergens?.trim() || null,
          dailyCapacity: body.dailyCapacity ?? null,
          isAvailable: body.isAvailable,
        },
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "partner.menu_item.created",
        entityType: "menu_item",
        entityId: item.id,
        metadata: { partnerId, name: item.name, pricePaise: item.pricePaise },
        ip: req.ip,
      });

      res.status(201).json(item);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.patch("/items/:id", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;
      const body = updateItemSchema.parse(req.body);

      // Enforce item belongs to partner's menu
      const item = await prisma.menuItem.findFirst({
        where: {
          id: req.params.id,
          menu: { partnerId },
        },
      });

      if (!item) {
        throw new AppError(404, "Menu item not found", "NOT_FOUND");
      }

      const updated = await prisma.menuItem.update({
        where: { id: item.id },
        data: {
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(body.description !== undefined
            ? { description: body.description?.trim() || null }
            : {}),
          ...(body.pricePaise !== undefined ? { pricePaise: body.pricePaise } : {}),
          ...(body.isVeg !== undefined ? { isVeg: body.isVeg } : {}),
          ...(body.allergens !== undefined
            ? { allergens: body.allergens?.trim() || null }
            : {}),
          ...(body.dailyCapacity !== undefined
            ? { dailyCapacity: body.dailyCapacity }
            : {}),
          ...(body.isAvailable !== undefined
            ? { isAvailable: body.isAvailable }
            : {}),
        },
      });

      res.json(updated);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.delete("/items/:id", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;

      const item = await prisma.menuItem.findFirst({
        where: {
          id: req.params.id,
          menu: { partnerId },
        },
      });

      if (!item) {
        throw new AppError(404, "Menu item not found", "NOT_FOUND");
      }

      await prisma.menuItem.delete({
        where: { id: item.id },
      });

      res.json({ success: true, deletedId: item.id });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

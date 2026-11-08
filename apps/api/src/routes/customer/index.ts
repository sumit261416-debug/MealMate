import { Router } from "express";
import { z } from "zod";
import type { AppConfig } from "../../config.js";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError, sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { createRequireAuth, requireRoles } from "../../middleware/auth.js";

const createAddressSchema = z.object({
  label: z.string().max(50).default("PG / Hostel"),
  pgName: z.string().max(100).optional(),
  roomFlat: z.string().max(50).optional(),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional(),
  landmark: z.string().max(100).optional(),
  instructions: z.string().max(300).optional(),
  serviceAreaId: z.string().min(1),
  isDefault: z.boolean().default(true),
});

const placeOrderSchema = z.object({
  partnerId: z.string().min(1),
  addressId: z.string().min(1),
  mealSlotId: z.string().min(1),
  deliveryDate: z.string().optional(), // ISO date or defaults to today
  notes: z.string().max(300).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
});

const createSubscriptionSchema = z.object({
  partnerId: z.string().min(1),
  addressId: z.string().min(1),
  mealSlotId: z.string().min(1),
  planType: z.enum(["weekly", "monthly"]), // 7 meals vs 30 meals
  startDate: z.string(), // ISO date
  notes: z.string().max(300).optional(),
});

export function createCustomerRouter(config: AppConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(config);
  const requireCustomer = requireRoles("customer", "admin");

  // ==========================================
  // Public / Semi-Public Discovery Endpoints
  // ==========================================

  // 1. Service Areas
  router.get("/service-areas", async (_req, res) => {
    try {
      const areas = await prisma.serviceArea.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
      res.json(areas);
    } catch (error) {
      sendError(res, error);
    }
  });

  // 2. Meal Slots
  router.get("/meal-slots", async (_req, res) => {
    try {
      const slots = await prisma.mealSlot.findMany({
        where: { isActive: true },
        orderBy: { cutoffHour: "asc" },
      });
      res.json(slots);
    } catch (error) {
      sendError(res, error);
    }
  });

  // 3. Kitchens & Menus Discovery (filterable by serviceAreaId)
  router.get("/kitchens", async (req, res) => {
    try {
      const serviceAreaId = req.query.serviceAreaId as string | undefined;

      const kitchens = await prisma.kitchenPartner.findMany({
        where: {
          status: "approved",
          ...(serviceAreaId
            ? {
                serviceAreas: {
                  some: { serviceAreaId },
                },
              }
            : {}),
        },
        include: {
          serviceAreas: {
            include: { serviceArea: true },
          },
          menus: {
            where: { isPublished: true },
            include: {
              items: {
                where: { isAvailable: true },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
        orderBy: { businessName: "asc" },
      });

      const response = kitchens.map((k) => ({
        id: k.id,
        businessName: k.businessName,
        contactPhone: k.contactPhone,
        serviceAreas: k.serviceAreas.map((sa) => sa.serviceArea),
        menus: k.menus,
        rating: 4.8,
        deliveryTimeMins: 30,
      }));

      res.json(response);
    } catch (error) {
      sendError(res, error);
    }
  });

  // 4. Kitchen Details by ID
  router.get("/kitchens/:id", async (req, res) => {
    try {
      const kitchen = await prisma.kitchenPartner.findFirst({
        where: { id: req.params.id, status: "approved" },
        include: {
          serviceAreas: { include: { serviceArea: true } },
          menus: {
            where: { isPublished: true },
            include: {
              items: {
                where: { isAvailable: true },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      });

      if (!kitchen) {
        throw new AppError(404, "Kitchen not found or not currently active", "NOT_FOUND");
      }

      res.json({
        id: kitchen.id,
        businessName: kitchen.businessName,
        contactEmail: kitchen.contactEmail,
        contactPhone: kitchen.contactPhone,
        serviceAreas: kitchen.serviceAreas.map((sa) => sa.serviceArea),
        menus: kitchen.menus,
        rating: 4.8,
        reviewCount: 42,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  // ==========================================
  // Protected Customer Endpoints
  // ==========================================

  // 5. Addresses (PG / Hostel friendly)
  router.get("/addresses", requireAuth, requireCustomer, async (req, res) => {
    try {
      const addresses = await prisma.customerAddress.findMany({
        where: { userId: req.authUser!.id },
        include: { serviceArea: true },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });
      res.json(addresses);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/addresses", requireAuth, requireCustomer, async (req, res) => {
    try {
      const body = createAddressSchema.parse(req.body);

      // If set as default, remove isDefault from previous addresses
      if (body.isDefault) {
        await prisma.customerAddress.updateMany({
          where: { userId: req.authUser!.id },
          data: { isDefault: false },
        });
      }

      const address = await prisma.customerAddress.create({
        data: {
          userId: req.authUser!.id,
          label: body.label,
          pgName: body.pgName?.trim() || null,
          roomFlat: body.roomFlat?.trim() || null,
          line1: body.line1.trim(),
          line2: body.line2?.trim() || null,
          landmark: body.landmark?.trim() || null,
          instructions: body.instructions?.trim() || null,
          serviceAreaId: body.serviceAreaId,
          isDefault: body.isDefault,
        },
        include: { serviceArea: true },
      });

      res.status(201).json(address);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.delete("/addresses/:id", requireAuth, requireCustomer, async (req, res) => {
    try {
      const addressId = req.params.id as string;
      const address = await prisma.customerAddress.findFirst({
        where: { id: addressId, userId: req.authUser!.id },
      });
      if (!address) {
        throw new AppError(404, "Address not found", "NOT_FOUND");
      }

      await prisma.customerAddress.delete({
        where: { id: address.id },
      });

      res.json({ success: true });
    } catch (error) {
      sendError(res, error);
    }
  });

  // 6. Orders
  router.get("/orders", requireAuth, requireCustomer, async (req, res) => {
    try {
      const orders = await prisma.order.findMany({
        where: { customerId: req.authUser!.id },
        include: {
          items: true,
          mealSlot: true,
          address: true,
          partner: {
            select: { id: true, businessName: true, contactPhone: true },
          },
          deliveryTask: {
            select: { status: true, assigneeName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      res.json(orders);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.get("/orders/:id", requireAuth, requireCustomer, async (req, res) => {
    try {
      const orderId = req.params.id as string;
      const order = await prisma.order.findFirst({
        where: { id: orderId, customerId: req.authUser!.id },
        include: {
          items: true,
          mealSlot: true,
          address: true,
          partner: {
            select: { id: true, businessName: true, contactPhone: true },
          },
          statusHistory: {
            orderBy: { createdAt: "asc" },
          },
          deliveryTask: true,
        },
      });

      if (!order) {
        throw new AppError(404, "Order not found", "NOT_FOUND");
      }

      res.json(order);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/orders", requireAuth, requireCustomer, async (req, res) => {
    try {
      const body = placeOrderSchema.parse(req.body);
      const customerId = req.authUser!.id;

      // Validate address
      const address = await prisma.customerAddress.findFirst({
        where: { id: body.addressId, userId: customerId },
      });
      if (!address || !address.serviceAreaId) {
        throw new AppError(400, "Valid delivery address with serviceable area is required", "INVALID_ADDRESS");
      }

      // Validate partner
      const partner = await prisma.kitchenPartner.findFirst({
        where: { id: body.partnerId, status: "approved" },
      });
      if (!partner) {
        throw new AppError(404, "Kitchen partner not found or not active", "PARTNER_NOT_FOUND");
      }

      // Fetch items and verify they belong to this partner
      const itemIds = body.items.map((i) => i.menuItemId);
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: { in: itemIds },
          isAvailable: true,
          menu: { partnerId: partner.id, isPublished: true },
        },
      });

      if (menuItems.length !== body.items.length) {
        throw new AppError(400, "One or more selected dishes are no longer available", "ITEMS_UNAVAILABLE");
      }

      const itemPriceMap = new Map(menuItems.map((m) => [m.id, m]));

      // Calculate subtotal
      let subtotalPaise = 0;
      const orderItemsData = body.items.map((reqItem) => {
        const item = itemPriceMap.get(reqItem.menuItemId)!;
        const linePricePaise = item.pricePaise * reqItem.quantity;
        subtotalPaise += linePricePaise;
        return {
          menuItemId: item.id,
          nameSnapshot: item.name,
          pricePaiseSnapshot: item.pricePaise,
          quantity: reqItem.quantity,
        };
      });

      // Fees from policy
      const deliveryFeePaise = 2000; // ₹20
      const platformFeePaise = 500;  // ₹5
      const taxPaise = 0;
      const totalPaise = subtotalPaise + deliveryFeePaise + platformFeePaise + taxPaise;

      const deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : new Date();

      // Create order transaction
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            customerId,
            partnerId: partner.id,
            addressId: address.id,
            serviceAreaId: address.serviceAreaId!,
            mealSlotId: body.mealSlotId,
            status: "placed",
            subtotalPaise,
            deliveryFeePaise,
            platformFeePaise,
            taxPaise,
            totalPaise,
            deliveryDate,
            notes: body.notes?.trim() || null,
            items: {
              create: orderItemsData,
            },
            statusHistory: {
              create: {
                fromStatus: null,
                toStatus: "placed",
                note: "Order confirmed by customer",
              },
            },
            deliveryTask: {
              create: {
                status: "unassigned",
              },
            },
          },
          include: {
            items: true,
            mealSlot: true,
            address: true,
            partner: {
              select: { id: true, businessName: true },
            },
          },
        });

        return newOrder;
      });

      await writeAuditLog({
        actorId: customerId,
        action: "order.created",
        entityType: "order",
        entityId: order.id,
        metadata: { totalPaise, partnerId: partner.id },
        ip: req.ip,
      });

      res.status(201).json(order);
    } catch (error) {
      sendError(res, error);
    }
  });

  // 7. Subscriptions (Weekly / Monthly Plans)
  router.get("/subscriptions", requireAuth, requireCustomer, async (req, res) => {
    try {
      const subs = await prisma.subscription.findMany({
        where: { customerId: req.authUser!.id },
        orderBy: { createdAt: "desc" },
      });
      res.json(subs);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/subscriptions", requireAuth, requireCustomer, async (req, res) => {
    try {
      const body = createSubscriptionSchema.parse(req.body);
      const customerId = req.authUser!.id;

      const partner = await prisma.kitchenPartner.findFirst({
        where: { id: body.partnerId, status: "approved" },
      });
      if (!partner) {
        throw new AppError(404, "Kitchen partner not found", "PARTNER_NOT_FOUND");
      }

      const totalMeals = body.planType === "weekly" ? 7 : 30;
      const pricePerMealPaise = 9900; // ₹99
      const totalPaise = totalMeals * pricePerMealPaise;

      const startDate = new Date(body.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (body.planType === "weekly" ? 7 : 30));

      const sub = await prisma.subscription.create({
        data: {
          customerId,
          partnerId: partner.id,
          status: "active",
          startDate,
          endDate,
          mealsTotal: totalMeals,
          mealsRemaining: totalMeals,
          pricePaise: totalPaise,
        },
      });

      await writeAuditLog({
        actorId: customerId,
        action: "subscription.created",
        entityType: "subscription",
        entityId: sub.id,
        metadata: { totalMeals, planType: body.planType },
        ip: req.ip,
      });

      res.status(201).json(sub);
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

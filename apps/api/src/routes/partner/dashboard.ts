import { Router } from "express";
import { sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

export function createPartnerDashboardRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;

      // Start of today (UTC / local midnight boundary)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const [
        partner,
        slots,
        openOrders,
        todayOrders,
        activeSubscriptions,
      ] = await Promise.all([
        prisma.kitchenPartner.findUnique({
          where: { id: partnerId },
          select: {
            id: true,
            businessName: true,
            status: true,
            rejectionReason: true,
            serviceAreas: { include: { serviceArea: true } },
          },
        }),
        prisma.mealSlot.findMany({
          where: { isActive: true },
          orderBy: { cutoffHour: "asc" },
        }),
        prisma.order.findMany({
          where: {
            partnerId,
            status: { in: ["placed", "accepted", "preparing", "ready"] },
          },
          select: {
            id: true,
            status: true,
            mealSlotId: true,
            totalPaise: true,
            createdAt: true,
          },
        }),
        prisma.order.findMany({
          where: {
            partnerId,
            createdAt: { gte: startOfDay, lte: endOfDay },
            status: { notIn: ["draft", "cancelled", "payment_failed"] },
          },
          select: {
            subtotalPaise: true,
            items: { select: { quantity: true } },
          },
        }),
        prisma.subscription.count({
          where: {
            partnerId,
            status: "active",
          },
        }),
      ]);

      const placedCount = openOrders.filter((o) => o.status === "placed").length;
      const preparingCount = openOrders.filter((o) => o.status === "preparing").length;
      const readyCount = openOrders.filter((o) => o.status === "ready").length;
      const acceptedCount = openOrders.filter((o) => o.status === "accepted").length;

      const ordersBySlot = slots.map((slot) => {
        const slotOrders = openOrders.filter((o) => o.mealSlotId === slot.id);
        return {
          code: slot.code,
          displayName: slot.displayName,
          cutoffHour: slot.cutoffHour,
          cutoffMinute: slot.cutoffMinute,
          openOrders: slotOrders.length,
          needsAttention: slotOrders.filter((o) => o.status === "placed").length,
        };
      });

      const todayMealsCount = todayOrders.reduce(
        (sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0),
        0,
      );
      const todayGrossPaise = todayOrders.reduce((sum, o) => sum + o.subtotalPaise, 0);

      res.json({
        partner,
        counts: {
          needsAcceptance: placedCount,
          cooking: preparingCount,
          accepted: acceptedCount,
          readyForPickup: readyCount,
          activeSubscriptions,
          todayMealsCount,
          todayGrossPaise,
        },
        ordersBySlot,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

import { Router } from "express";
import { sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

export function createDashboardRouter(): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      const [
        pendingPartners,
        approvedPartners,
        openOrders,
        openTickets,
        customers,
        menusPendingReview,
        refundRequested,
        unassignedDeliveries,
        ordersByStatus,
        paymentsByStatus,
      ] = await Promise.all([
        prisma.kitchenPartner.count({
          where: { status: { in: ["submitted", "under_review"] } },
        }),
        prisma.kitchenPartner.count({ where: { status: "approved" } }),
        prisma.order.count({
          where: {
            status: {
              in: [
                "placed",
                "accepted",
                "preparing",
                "ready",
                "out_for_delivery",
              ],
            },
          },
        }),
        prisma.supportTicket.count({
          where: { status: { in: ["open", "in_progress"] } },
        }),
        prisma.userRole.count({ where: { role: "customer" } }),
        prisma.menu.count({ where: { isPublished: false } }),
        prisma.refund.count({ where: { status: "requested" } }),
        prisma.deliveryTask.count({ where: { status: "unassigned" } }),
        prisma.order.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        prisma.payment.groupBy({
          by: ["status"],
          _count: { _all: true },
          _sum: { amountPaise: true },
        }),
      ]);

      const ordersBySlot = await prisma.order.groupBy({
        by: ["mealSlotId"],
        where: {
          status: {
            in: ["placed", "accepted", "preparing", "ready", "out_for_delivery"],
          },
        },
        _count: { _all: true },
      });

      const slots = await prisma.mealSlot.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
      });

      const slotCounts = slots.map((slot) => ({
        code: slot.code,
        displayName: slot.displayName,
        openOrders:
          ordersBySlot.find((row) => row.mealSlotId === slot.id)?._count._all ??
          0,
      }));

      res.json({
        pendingPartners,
        approvedPartners,
        openOrders,
        openTickets,
        customers,
        menusPendingReview,
        refundRequested,
        unassignedDeliveries,
        ordersBySlot: slotCounts,
        charts: {
          ordersByStatus: ordersByStatus.map((row) => ({
            status: row.status,
            count: row._count._all,
          })),
          paymentsByStatus: paymentsByStatus.map((row) => ({
            status: row.status,
            count: row._count._all,
            amountPaise: row._sum.amountPaise ?? 0,
          })),
        },
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

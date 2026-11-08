import { Router } from "express";
import { sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

export function createPartnerPayoutsRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;

      // Traceable payout calculations:
      // Orders that are ready, out_for_delivery, or delivered count towards earnings
      const orders = await prisma.order.findMany({
        where: {
          partnerId,
          status: { in: ["ready", "out_for_delivery", "delivered"] },
        },
        select: {
          id: true,
          status: true,
          subtotalPaise: true,
          platformFeePaise: true,
          deliveryFeePaise: true,
          totalPaise: true,
          createdAt: true,
          items: {
            select: { nameSnapshot: true, quantity: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Payout breakdown:
      // Partner receives subtotal (food amount) minus platform commission (e.g. platformFeePaise or 10% standard commission)
      const grossSalesPaise = orders.reduce((sum, o) => sum + o.subtotalPaise, 0);
      const totalPlatformFeesPaise = orders.reduce(
        (sum, o) => sum + o.platformFeePaise,
        0,
      );
      const netPayablePaise = Math.max(0, grossSalesPaise - totalPlatformFeesPaise);

      // Ledger items
      const ledger = orders.map((o) => {
        const netOrderPaise = o.subtotalPaise - o.platformFeePaise;
        return {
          orderId: o.id,
          date: o.createdAt,
          status: o.status,
          itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
          grossAmountPaise: o.subtotalPaise,
          platformDeductionPaise: o.platformFeePaise,
          netEarningsPaise: netOrderPaise,
        };
      });

      res.json({
        summary: {
          totalEligibleOrders: orders.length,
          grossSalesPaise,
          totalPlatformFeesPaise,
          netPayablePaise,
          payoutStatus: "cycle_pending", // weekly / bi-weekly payout settlement
          nextSettlementDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        ledger,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

import { Router } from "express";
import { sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

export function createPartnerSubscriptionsRouter(): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const partnerId = req.authPartner!.id;

      const subscriptions = await prisma.subscription.findMany({
        where: { partnerId },
        include: {
          customer: {
            select: { id: true, fullName: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const activeCount = subscriptions.filter((s) => s.status === "active").length;
      const pausedCount = subscriptions.filter((s) => s.status === "paused").length;
      const totalRemainingMeals = subscriptions
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + s.mealsRemaining, 0);

      res.json({
        summary: {
          activeCount,
          pausedCount,
          totalRemainingMeals,
        },
        items: subscriptions,
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

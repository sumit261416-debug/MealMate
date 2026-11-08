import { MealSlotCode } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError, sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

const areaSchema = z.object({
  name: z.string().min(2).max(120),
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_-]+$/i, "Code must be alphanumeric"),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

const slotUpdateSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  cutoffHour: z.number().int().min(0).max(23).optional(),
  cutoffMinute: z.number().int().min(0).max(59).optional(),
  cutoffPrevDay: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const policySchema = z.object({
  cancellationCutoffMinutes: z.number().int().min(0).max(24 * 60).optional(),
  refundWindowHours: z.number().int().min(0).max(168).optional(),
  deliveryFeePaise: z.number().int().min(0).optional(),
  platformFeePaise: z.number().int().min(0).optional(),
});

export function createServiceConfigRouter(): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      const [serviceAreas, mealSlots, policy] = await Promise.all([
        prisma.serviceArea.findMany({ orderBy: { name: "asc" } }),
        prisma.mealSlot.findMany({ orderBy: { code: "asc" } }),
        prisma.appSetting.findUnique({ where: { key: "ops_policy" } }),
      ]);

      res.json({
        serviceAreas,
        mealSlots,
        policy: policy?.value ?? {
          cancellationCutoffMinutes: 60,
          refundWindowHours: 24,
          deliveryFeePaise: 2000,
          platformFeePaise: 500,
        },
      });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/areas", async (req, res) => {
    try {
      const body = areaSchema.parse(req.body);
      const created = await prisma.serviceArea.create({
        data: {
          name: body.name,
          code: body.code.toLowerCase(),
          description: body.description,
          isActive: body.isActive ?? true,
        },
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "service_area.create",
        entityType: "service_area",
        entityId: created.id,
        ip: req.ip,
      });

      res.status(201).json(created);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.patch("/areas/:id", async (req, res) => {
    try {
      const body = areaSchema.partial().parse(req.body);
      const existing = await prisma.serviceArea.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) {
        throw new AppError(404, "Service area not found", "NOT_FOUND");
      }

      const updated = await prisma.serviceArea.update({
        where: { id: existing.id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.code !== undefined ? { code: body.code.toLowerCase() } : {}),
          ...(body.description !== undefined
            ? { description: body.description }
            : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        },
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "service_area.update",
        entityType: "service_area",
        entityId: updated.id,
        ip: req.ip,
      });

      res.json(updated);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.patch("/slots/:code", async (req, res) => {
    try {
      const code = z.nativeEnum(MealSlotCode).parse(req.params.code);
      const body = slotUpdateSchema.parse(req.body);
      const existing = await prisma.mealSlot.findUnique({ where: { code } });
      if (!existing) {
        throw new AppError(404, "Meal slot not found", "NOT_FOUND");
      }

      const updated = await prisma.mealSlot.update({
        where: { code },
        data: body,
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "meal_slot.update",
        entityType: "meal_slot",
        entityId: updated.id,
        metadata: body,
        ip: req.ip,
      });

      res.json(updated);
    } catch (error) {
      sendError(res, error);
    }
  });

  router.put("/policy", async (req, res) => {
    try {
      const body = policySchema.parse(req.body);
      const current = await prisma.appSetting.findUnique({
        where: { key: "ops_policy" },
      });
      const merged = {
        cancellationCutoffMinutes: 60,
        refundWindowHours: 24,
        deliveryFeePaise: 2000,
        platformFeePaise: 500,
        ...(typeof current?.value === "object" && current.value !== null
          ? (current.value as Record<string, unknown>)
          : {}),
        ...body,
      };

      const saved = await prisma.appSetting.upsert({
        where: { key: "ops_policy" },
        create: { key: "ops_policy", value: merged },
        update: { value: merged },
      });

      await writeAuditLog({
        actorId: req.authUser!.id,
        action: "ops_policy.update",
        entityType: "app_setting",
        entityId: saved.id,
        metadata: merged,
        ip: req.ip,
      });

      res.json(saved.value);
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

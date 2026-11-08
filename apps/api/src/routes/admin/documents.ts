import { Router } from "express";
import { z } from "zod";
import type { AppConfig } from "../../config.js";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError, sendError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { verifyDocumentAccessToken } from "../../lib/signed-docs.js";
import { readPrivateFile } from "../../lib/storage.js";

export function createDocumentsRouter(config: AppConfig): Router {
  const router = Router();

  router.get("/view", async (req, res) => {
    try {
      const token = z.string().min(20).parse(req.query.token);
      const claims = await verifyDocumentAccessToken(token, config.JWT_SECRET);

      const doc = await prisma.partnerDocument.findFirst({
        where: { id: claims.documentId, partnerId: claims.partnerId },
      });
      if (!doc) {
        throw new AppError(404, "Document not found", "NOT_FOUND");
      }

      const buffer = await readPrivateFile(doc.storageKey);

      await writeAuditLog({
        actorId: claims.actorId,
        action: "partner_document.viewed",
        entityType: "partner_document",
        entityId: doc.id,
        ip: req.ip,
      });

      res.setHeader(
        "Content-Type",
        doc.mimeType ?? "application/octet-stream",
      );
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${doc.originalName ?? "document"}"`,
      );
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(buffer);
    } catch (error) {
      if (error instanceof Error && error.message.includes("jwt")) {
        sendError(res, new AppError(401, "Document link expired or invalid", "UNAUTHENTICATED"));
        return;
      }
      sendError(res, error);
    }
  });

  return router;
}

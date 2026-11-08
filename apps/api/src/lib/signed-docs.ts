import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export async function signDocumentAccessToken(input: {
  documentId: string;
  partnerId: string;
  actorId: string;
  secret: string;
  expiresIn?: string;
}): Promise<string> {
  return new SignJWT({
    documentId: input.documentId,
    partnerId: input.partnerId,
    actorId: input.actorId,
    purpose: "partner_document_read",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(input.expiresIn ?? "5m")
    .setIssuer("mealmate-api")
    .setAudience("mealmate-doc-access")
    .sign(encoder.encode(input.secret));
}

export async function verifyDocumentAccessToken(
  token: string,
  secret: string,
): Promise<{ documentId: string; partnerId: string; actorId: string }> {
  const { payload } = await jwtVerify(token, encoder.encode(secret), {
    algorithms: ["HS256"],
    issuer: "mealmate-api",
    audience: "mealmate-doc-access",
  });

  if (
    payload.purpose !== "partner_document_read" ||
    typeof payload.documentId !== "string" ||
    typeof payload.partnerId !== "string" ||
    typeof payload.actorId !== "string"
  ) {
    throw new Error("Invalid document token");
  }

  return {
    documentId: payload.documentId,
    partnerId: payload.partnerId,
    actorId: payload.actorId,
  };
}

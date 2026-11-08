import { SignJWT, jwtVerify } from "jose";
import type { RoleName } from "@prisma/client";

export type AccessTokenPayload = {
  sub: string;
  roles: RoleName[];
  email?: string | null;
};

const encoder = new TextEncoder();

export async function signAccessToken(
  payload: AccessTokenPayload,
  secret: string,
  expiresIn = "8h",
  audience = "mealmate-admin",
): Promise<string> {
  return new SignJWT({
    roles: payload.roles,
    email: payload.email ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setIssuer("mealmate-api")
    .setAudience(audience)
    .sign(encoder.encode(secret));
}

export async function verifyAccessToken(
  token: string,
  secret: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, encoder.encode(secret), {
    algorithms: ["HS256"],
    issuer: "mealmate-api",
    audience: ["mealmate-admin", "mealmate-partner", "mealmate-customer"],
  });

  if (!payload.sub || !Array.isArray(payload.roles)) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: payload.sub,
    roles: payload.roles as RoleName[],
    email: (payload.email as string | null | undefined) ?? null,
  };
}

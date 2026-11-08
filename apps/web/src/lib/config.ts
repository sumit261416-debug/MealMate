export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? "http://localhost:4000";
}

export const ADMIN_TOKEN_COOKIE = "mm_admin_token";

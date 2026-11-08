import type { OrderStatus } from "@prisma/client";

/** Admin-allowed status transitions (fail closed for unknown edges). */
const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["placed", "payment_failed", "cancelled"],
  payment_failed: ["pending_payment", "cancelled"],
  placed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function canAdminTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return false;
  return ADMIN_TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedAdminTransitions(from: OrderStatus): OrderStatus[] {
  return ADMIN_TRANSITIONS[from] ?? [];
}

/** Kitchen-partner allowed status transitions (placed -> accepted -> preparing -> ready). */
const KITCHEN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: [],
  pending_payment: [],
  payment_failed: [],
  placed: ["accepted"],
  accepted: ["preparing"],
  preparing: ["ready"],
  ready: [],
  out_for_delivery: [],
  delivered: [],
  cancelled: [],
};

export function canKitchenTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return false;
  return KITCHEN_TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedKitchenTransitions(from: OrderStatus): OrderStatus[] {
  return KITCHEN_TRANSITIONS[from] ?? [];
}

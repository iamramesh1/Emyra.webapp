// =====================================================================
// ORDER SERVICE — create/read/manage orders (backed by digitalApi).
// =====================================================================

import { digitalApi as api } from "./apiInstances";

// `digitalApi`'s baseURL already ends in "/api" (see apiInstances.js), and
// OrdersController is hosted by the digital API at "api/[controller]".
// Append "/Orders", not "/api/Orders", to avoid duplicating the API prefix.
const ORDERS_BASE = "/Orders";
const unwrap = (res) => res?.data ?? res;

const orderService = {
  // ── List / Read ─────────────────────────────────────────────────────
  getOrders: async () => unwrap(await api.get(ORDERS_BASE)),

  getMyOrders: async () => unwrap(await api.get(`${ORDERS_BASE}/my`)),

  getOrder: async (id) => unwrap(await api.get(`${ORDERS_BASE}/${id}`)),

  // ── Create ──────────────────────────────────────────────────────────
  createOrder: async (payload) => unwrap(await api.post(ORDERS_BASE, payload)),

  // ── Status transitions ──────────────────────────────────────────────
  approveOrder: async (id) => unwrap(await api.put(`${ORDERS_BASE}/approve/${id}`)),

  rejectOrder: async (id, reason) =>
    unwrap(await api.put(`${ORDERS_BASE}/reject/${id}`, null, { params: { reason } })),

  cancelOrder: async (id, reason) =>
    unwrap(await api.put(
      `${ORDERS_BASE}/cancel/${id}`,
      null,
      reason?.trim() ? { params: { reason: reason.trim() } } : undefined
    )),

  dispatchOrder: async (id, location) =>
    unwrap(await api.put(`${ORDERS_BASE}/dispatch/${id}`, null, { params: { location } })),

  deliverOrder: async (id) => unwrap(await api.put(`${ORDERS_BASE}/deliver/${id}`)),
};

export default orderService;

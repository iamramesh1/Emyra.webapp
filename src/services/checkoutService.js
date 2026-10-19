// =====================================================================
// CHECKOUT SERVICE — delivery addresses (backed by digitalApi).
// Order / payment / shipment each have their own dedicated service
// (orderService, paymentService, shipmentService) so responsibilities
// stay separated and easy to swap out per-API.
//
// NOTE: UserAddressController uses the API's action-name-based routing
// (api/UserAddress/{ActionName}/...), unlike Orders/Payment/Shipment/B2B
// which expose clean REST paths - hence the slightly different URL shape
// below (Update/{id}, Delete/{id} instead of just {id}).
// =====================================================================

import { digitalApi as api } from "./apiInstances";

const unwrap = (res) => res?.data ?? res;

const checkoutService = {
  // ── Addresses ────────────────────────────────────────────────────────
  getAddresses: async () => {
    const res = await api.get("/UserAddress/GetByuserid");
    const data = unwrap(res);
    return Array.isArray(data) ? data : data ? [data] : [];
  },

  addAddress: async (payload) =>
    unwrap(await api.post("/UserAddress/Create", { country: "India", ...payload })),

  updateAddress: async (id, payload) =>
    unwrap(await api.put(`/UserAddress/Update/${id}`, { country: "India", ...payload })),

  deleteAddress: async (id) => unwrap(await api.delete(`/UserAddress/Delete/${id}`)),
};

export default checkoutService;

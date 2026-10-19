// =====================================================================
// SHIPMENT SERVICE
// Backed by the real ShipmentController (Ecom.AgentSolution.API):
//   POST /api/Shipment                       create a shipment for an order
//   PUT  /api/Shipment                       update a shipment
//   POST /api/Shipment/tracking              add a tracking event
//   GET  /api/Shipment/{shipmentId}
//   GET  /api/Shipment/order/{orderId}
//   GET  /api/Shipment/{shipmentId}/tracking
// =====================================================================

import { digitalApi as api } from "./apiInstances";

// digitalApi's baseURL already ends in "/api"; ShipmentController's route
// is "api/[controller]" -> the path appended here is just "/Shipment".
const SHIPMENT_BASE = "/Shipment";
const unwrap = (res) => res?.data ?? res;

const shipmentService = {
  async createShipment(data) {
    return unwrap(
      await api.post(SHIPMENT_BASE, {
        OrderId: data.orderId,
        CourierName: data.courierName ?? null,
        TrackingNumber: data.trackingNumber ?? null,
        ShipmentStatus: data.shipmentStatus ?? "PENDING",
        EstimatedDeliveryDate: data.estimatedDeliveryDate ?? null,
        Remarks: data.remarks ?? null,
      })
    );
  },

  async updateShipment(data) {
    return unwrap(await api.put(SHIPMENT_BASE, data));
  },

  async addTracking(data) {
    return unwrap(
      await api.post(`${SHIPMENT_BASE}/tracking`, {
        ShipmentId: data.shipmentId,
        TrackingStatus: data.trackingStatus,
        Location: data.location ?? null,
        Description: data.description ?? null,
      })
    );
  },

  /** Fetch the shipment record for a given order (courier, tracking #, status). */
  async getShipmentByOrder(orderId) {
    try {
      const res = unwrap(await api.get(`${SHIPMENT_BASE}/order/${orderId}`));
      return Array.isArray(res) ? res[0] ?? null : res;
    } catch (err) {
      console.error("getShipmentByOrder failed:", err);
      return null;
    }
  },

  /** Full tracking event history for a shipment (for a live tracking timeline). */
  async getTrackingHistory(shipmentId) {
    try {
      const res = unwrap(await api.get(`${SHIPMENT_BASE}/${shipmentId}/tracking`));
      return Array.isArray(res) ? res : res ? [res] : [];
    } catch (err) {
      console.error("getTrackingHistory failed:", err);
      return [];
    }
  },
};

export default shipmentService;

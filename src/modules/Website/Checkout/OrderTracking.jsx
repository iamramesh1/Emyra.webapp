import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaArrowLeft, FaClock, FaCheckCircle, FaTruck, FaBoxOpen,
  FaTimesCircle, FaBan, FaSyncAlt, FaMapMarkerAlt,
} from "react-icons/fa";
import orderService from "../../../services/orderService";
import shipmentService from "../../../services/shipmentService";

const STEPS = [
  { key: "pending", label: "Order Placed", icon: FaClock },
  { key: "confirmed", label: "Confirmed", icon: FaCheckCircle },
  { key: "processing", label: "Processing", icon: FaBoxOpen },
  { key: "shipped", label: "Shipped", icon: FaTruck },
  { key: "outfordelivery", label: "Out for Delivery", icon: FaTruck },
  { key: "delivered", label: "Delivered", icon: FaBoxOpen },
];

const STATUS_ALIASES = {
  approved: "confirmed",
  dispatched: "shipped",
  intransit: "shipped",
  pickedup: "shipped",
};
const TERMINAL_BAD = ["rejected", "cancelled", "returned"];
const normalizeStatus = (value) => {
  const normalized = String(value ?? "Pending").replace(/[\s_-]/g, "").toLowerCase();
  return STATUS_ALIASES[normalized] ?? normalized;
};

function responseData(response) {
  let data = response?.data ?? response;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!data || typeof data !== "object" || Array.isArray(data)) break;
    const nested = data.data ?? data.Data;
    if (nested === undefined || nested === data) break;
    data = nested;
  }
  return data;
}

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder]   = useState(null);
  const [shipment, setShipment] = useState(null);
  const [shipmentTracking, setShipmentTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = responseData(await orderService.getOrder(id));
      setError("");
      const data = response?.order ?? response?.Order ?? response;
      setOrder({
        ...data,
        items: data?.items ?? data?.Items ?? data?.orderItems ?? data?.OrderItems ??
          response?.items ?? response?.Items ?? response?.orderItems ?? response?.OrderItems ?? [],
        tracking: data?.tracking ?? data?.Tracking ?? response?.tracking ?? response?.Tracking ?? [],
      });
      const shipmentResponse = responseData(await shipmentService.getShipmentByOrder(id));
      const shipmentData = Array.isArray(shipmentResponse) ? shipmentResponse[0] : shipmentResponse;
      const shipmentRecord = shipmentData?.shipment ?? shipmentData?.Shipment ?? shipmentData;
      setShipment(shipmentRecord && typeof shipmentRecord === "object" ? shipmentRecord : null);
      const shipmentId = shipmentRecord?.shipmentId ?? shipmentRecord?.ShipmentId ??
        shipmentRecord?.id ?? shipmentRecord?.Id;
      setShipmentTracking(shipmentId
        ? await shipmentService.getTrackingHistory(shipmentId)
        : []);
    } catch (err) {
      console.error("getOrder failed", err);
      setError("Couldn't load this order. It may not exist or you may not have access to it.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const refreshOrder = async () => {
    setRefreshing(true);
    setError("");
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <div style={{ color: "var(--text2)", fontSize: 16 }}>Loading order…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ padding: "40px 64px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <FaTimesCircle size={48} style={{ color: "#ff4455", marginBottom: 16 }} />
        <p style={{ color: "var(--text2)", marginBottom: 24 }}>{error || "Order not found."}</p>
        <Link to="/orders" style={{ color: "var(--accent)", fontWeight: 600 }}>Back to My Orders</Link>
      </div>
    );
  }

  // Normalize a few likely field-name variants since the actual Order model wasn't available
  const orderStatus = order.orderStatus ?? order.OrderStatus ?? order.status ?? order.Status ?? "Pending";
  const shipmentStatus = shipment?.shipmentStatus ?? shipment?.ShipmentStatus ?? shipment?.status ?? shipment?.Status;
  const orderStep = STEPS.findIndex((step) => step.key === normalizeStatus(orderStatus));
  const shipmentStep = shipmentStatus
    ? STEPS.findIndex((step) => step.key === normalizeStatus(shipmentStatus))
    : -1;
  const status = !TERMINAL_BAD.includes(normalizeStatus(orderStatus)) && shipmentStep > orderStep
    ? shipmentStatus
    : orderStatus;
  const normalizedStatus = normalizeStatus(status);
  const orderId     = order.id ?? order.orderId ?? order.OrderId ?? order.Id ?? id;
  const orderItems  = order.items ?? order.Items ?? order.orderItems ?? order.OrderItems ?? [];
  const items       = Array.isArray(orderItems) ? orderItems : [];
  const orderTrackingValue = order.tracking ?? order.Tracking ?? [];
  const orderTracking = Array.isArray(orderTrackingValue) ? orderTrackingValue : [];
  const tracking = shipmentTracking.length ? shipmentTracking : orderTracking;
  const total       = order.finalAmount ?? order.FinalAmount ?? order.total ?? order.Total ?? order.totalAmount ?? order.TotalAmount ?? 0;
  const reason      = order.rejectReason ?? order.reason ?? order.Reason;
  const dispatchLoc = order.dispatchLocation ?? order.location ?? order.Location;
  const address     = order.address ?? order.Address;

  const isBad = TERMINAL_BAD.includes(normalizedStatus);
  const currentStepIndex = STEPS.findIndex((s) => s.key === normalizedStatus);

  return (
    <div style={{ padding: "40px 64px", maxWidth: 900, margin: "0 auto" }}>
      <Link
        to="/orders"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text2)", fontSize: 14, marginBottom: 32 }}
      >
        <FaArrowLeft /> My Orders
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, marginBottom: 6 }}>
            Order #{orderId}
          </h1>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>
            Total: <strong style={{ color: "var(--text)" }}>₹{Number(total).toFixed(2)}</strong>
          </div>
          <div style={{ color: "var(--text2)", fontSize: 13, marginTop: 4 }}>
            Payment: {order.paymentStatus ?? order.PaymentStatus ?? "Pending"}
          </div>
        </div>
        <button
          onClick={refreshOrder}
          disabled={refreshing}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
            background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8,
            color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer",
          }}
        >
          <FaSyncAlt className={refreshing ? "spin" : ""} size={13} /> Refresh Status
        </button>
      </div>

      {/* ── Status ── */}
      {isBad ? (
        <div style={{
          background: "rgba(255,68,85,0.08)", border: "1px solid #ff4455", borderRadius: "var(--radius)",
          padding: 24, marginBottom: 32, display: "flex", gap: 16, alignItems: "flex-start",
        }}>
          <FaBan size={22} style={{ color: "#ff4455", marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#ff4455", marginBottom: 4 }}>
              Order {String(status).replace(/([a-z])([A-Z])/g, "$1 $2")}
            </div>
            {reason && (
              <div style={{ fontSize: 14, color: "var(--text2)" }}>Reason: {reason}</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
          padding: "32px 24px", marginBottom: 32,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done   = i <= currentStepIndex;
              const active = i === currentStepIndex;
              return (
                <React.Fragment key={step.key}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: done ? "var(--accent)" : "var(--surface2)",
                      border: done ? "none" : "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: done ? "white" : "var(--text2)",
                      boxShadow: active ? "0 0 0 4px rgba(217,119,87,0.2)" : "none",
                      marginBottom: 10,
                    }}>
                      <Icon size={18} />
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      color: done ? "var(--text)" : "var(--text2)", textAlign: "center",
                    }}>
                      {step.label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      height: 2, flex: 1, marginTop: 22,
                      background: i < currentStepIndex ? "var(--accent)" : "var(--border)",
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {dispatchLoc && currentStepIndex >= 3 && (
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text2)" }}>
              <FaMapMarkerAlt style={{ color: "var(--accent)" }} />
              Last known location: <strong style={{ color: "var(--text)" }}>{dispatchLoc}</strong>
            </div>
          )}

          {tracking.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 14 }}>Tracking Updates</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[...tracking].reverse().map((event, index) => (
                  <div key={event.trackingId ?? event.TrackingId ?? `${event.status ?? event.Status}-${index}`} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                    <FaMapMarkerAlt style={{ color: "var(--accent)", marginTop: 3, flexShrink: 0 }} />
                    <div>
                      <strong>{event.trackingStatus ?? event.TrackingStatus ?? event.status ?? event.Status ?? "Status updated"}</strong>
                      {(event.location ?? event.Location) && <span> · {event.location ?? event.Location}</span>}
                      {(event.description ?? event.Description ?? event.remarks ?? event.Remarks) && (
                        <div style={{ color: "var(--text2)", marginTop: 3 }}>
                          {event.description ?? event.Description ?? event.remarks ?? event.Remarks}
                        </div>
                      )}
                      {(event.createdDate ?? event.CreatedDate ?? event.createdAt ?? event.CreatedAt) && (
                        <div style={{ color: "var(--text2)", marginTop: 3 }}>
                          {new Date(event.createdDate ?? event.CreatedDate ?? event.createdAt ?? event.CreatedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Items ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16 }}>Delivery tracking</h3>
        {shipment ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, fontSize: 14 }}>
              <div><span style={{ color: "var(--text2)" }}>Shipment status</span><br /><strong>{shipmentStatus ?? status}</strong></div>
              {(shipment.courierName ?? shipment.CourierName) && (
                <div><span style={{ color: "var(--text2)" }}>Courier</span><br /><strong>{shipment.courierName ?? shipment.CourierName}</strong></div>
              )}
              {(shipment.trackingNumber ?? shipment.TrackingNumber) && (
                <div><span style={{ color: "var(--text2)" }}>Tracking number</span><br /><strong>{shipment.trackingNumber ?? shipment.TrackingNumber}</strong></div>
              )}
              {(shipment.estimatedDeliveryDate ?? shipment.EstimatedDeliveryDate) && (
                <div><span style={{ color: "var(--text2)" }}>Estimated delivery</span><br /><strong>{new Date(shipment.estimatedDeliveryDate ?? shipment.EstimatedDeliveryDate).toLocaleDateString()}</strong></div>
              )}
            </div>
            {!tracking.length && normalizedStatus !== "delivered" && (
              <p style={{ color: "var(--text2)", fontSize: 13, margin: "14px 0 0" }}>
                Tracking updates will appear here as the shipment moves.
              </p>
            )}
          </>
        ) : (
          <p style={{ color: "var(--text2)", fontSize: 14, margin: 0 }}>
            Your order is being prepared. Shipment and tracking details will appear here when available.
          </p>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16 }}>Items</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--text2)" }}>
                <span>{item.title ?? item.Title ?? item.productName ?? item.ProductName ?? `Product #${item.productId ?? item.ProductId}`} × {item.quantity ?? item.Quantity}</span>
                <span>₹{Number(item.totalPrice ?? item.TotalPrice ?? ((item.unitPrice ?? item.UnitPrice ?? item.price ?? item.Price ?? 0) * (item.quantity ?? item.Quantity ?? 1))).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {address && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24, marginTop: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 12 }}>Delivering To</h3>
          <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>
            {address.fullName ?? address.FullName} · {address.phone ?? address.Phone}<br />
            {address.line1 ?? address.Line1}{(address.line2 ?? address.Line2) ? `, ${address.line2 ?? address.Line2}` : ""}, {address.city ?? address.City}, {address.state ?? address.State} - {address.pincode ?? address.Pincode}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
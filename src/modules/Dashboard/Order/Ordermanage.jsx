import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaBoxOpen,
  FaFilter,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaEye,
  FaTruck,
  FaBan,
  FaMapMarkerAlt,
  FaDownload,
} from "react-icons/fa";
import axios from "axios";
import env from "../../../config/env";
import orderService from "../../../services/orderService";

// ==========================================
// CONFIG / API CLIENT
// ==========================================

const API_BASE = `${env.DIGITAL_API_URL}/Orders`; // OrdersController is hosted by the digital API

const getToken = () => localStorage.getItem("accessToken");

const api = axios.create({ baseURL: env.DIGITAL_API_URL });
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ORDER_STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

const PAYMENT_STATUS_OPTIONS = ["Pending", "Paid", "Failed", "Refunded"];
const PAYMENT_METHOD_OPTIONS = ["COD", "Card", "UPI", "NetBanking", "Wallet"];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ==========================================
// HELPERS
// ==========================================

function currency(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function mapOrderFromApi(o) {
  return {
    orderId: o.OrderId ?? o.orderId ?? o.Id ?? o.id,
    orderNumber: o.OrderNumber ?? o.orderNumber ?? o.OrderNo ?? o.orderNo ?? "",
    userId: o.UserId ?? o.userId ?? "",
    addressId: o.AddressId ?? o.addressId ?? null,
    totalAmount: o.TotalAmount ?? o.totalAmount ?? 0,
    discountAmount: o.DiscountAmount ?? o.discountAmount ?? 0,
    taxAmount: o.TaxAmount ?? o.taxAmount ?? 0,
    shippingCharge: o.ShippingCharge ?? o.shippingCharge ?? 0,
    finalAmount: o.FinalAmount ?? o.finalAmount ?? 0,
    orderStatus: o.OrderStatus ?? o.orderStatus ?? "",
    paymentStatus: o.PaymentStatus ?? o.paymentStatus ?? "",
    paymentMethod: o.PaymentMethod ?? o.paymentMethod ?? "",
    createdDate: o.CreatedDate ?? o.createdDate,
    isActive: o.IsActive ?? o.isActive ?? true,
    status: o.Status ?? o.status ?? "",
  };
}

function canCancelOrder(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized !== "cancelled" && normalized !== "delivered" && normalized !== "returned";
}

function canDownloadInvoice(status) {
  return ["confirmed", "approved", "dispatched", "delivered"].includes(String(status || "").trim().toLowerCase());
}

function mapItemFromApi(i) {
  return {
    orderItemId: i.OrderItemId ?? i.orderItemId,
    productId: i.ProductId ?? i.productId,
    productName: i.ProductName ?? i.productName ?? "Unknown product",
    sku: i.SKU ?? i.sku ?? "",
    imageUrl: i.Imageurl ?? i.imageUrl ?? "",
    quantity: i.Quantity ?? i.quantity ?? 0,
    unitPrice: i.UnitPrice ?? i.unitPrice ?? 0,
    totalPrice: i.TotalPrice ?? i.totalPrice ?? 0,
    remark: i.Remark ?? i.remark ?? "",
  };
}

function mapTrackingFromApi(t) {
  return {
    trackingId: t.TrackingId ?? t.trackingId,
    status: t.Status ?? t.status ?? "",
    remarks: t.Remarks ?? t.remarks ?? "",
    location: t.Location ?? t.location ?? "",
    createdDate: t.CreatedDate ?? t.createdDate,
    createdBy: t.CreatedBy ?? t.createdBy ?? "",
  };
}

// ==========================================
// TOAST
// ==========================================

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const isError = toast.type === "error";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 18px",
        borderRadius: "var(--radius)",
        background: isError ? "#3b1414" : "#0f2e1f",
        border: `1px solid ${isError ? "#b91c1c" : "var(--success)"}`,
        color: "#fff",
        minWidth: 260,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      {isError ? <FaExclamationCircle color="#f87171" /> : <FaCheckCircle color="var(--success)" />}
      <span style={{ fontSize: 14 }}>{toast.message}</span>
    </div>
  );
}

// ==========================================
// STATUS BADGE
// ==========================================

const STATUS_COLORS = {
  Pending: { bg: "rgba(234,179,8,0.15)", fg: "#eab308" },
  Confirmed: { bg: "rgba(59,130,246,0.15)", fg: "#3b82f6" },
  Processing: { bg: "rgba(168,85,247,0.15)", fg: "#a855f7" },
  Shipped: { bg: "rgba(6,182,212,0.15)", fg: "#06b6d4" },
  OutForDelivery: { bg: "rgba(6,182,212,0.15)", fg: "#06b6d4" },
  Delivered: { bg: "rgba(34,197,94,0.15)", fg: "var(--success)" },
  Cancelled: { bg: "rgba(239,68,68,0.15)", fg: "#f87171" },
  Returned: { bg: "rgba(148,163,184,0.15)", fg: "var(--text2)" },
  Paid: { bg: "rgba(34,197,94,0.15)", fg: "var(--success)" },
  Failed: { bg: "rgba(239,68,68,0.15)", fg: "#f87171" },
  Refunded: { bg: "rgba(148,163,184,0.15)", fg: "var(--text2)" },
};

function StatusBadge({ value }) {
  const c = STATUS_COLORS[value] || { bg: "rgba(148,163,184,0.15)", fg: "var(--text2)" };
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        whiteSpace: "nowrap",
      }}
    >
      {value || "Unknown"}
    </span>
  );
}

// ==========================================
// ORDER DETAIL / MANAGE MODAL
// ==========================================

function OrderDetailModal({ orderId, onClose, onChanged, onDownloadInvoice, downloadingInvoice, notify }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  const [statusDraft, setStatusDraft] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");
  const [statusLocation, setStatusLocation] = useState("");
  const [paymentDraft, setPaymentDraft] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [trackingStatus, setTrackingStatus] = useState("");
  const [trackingLocation, setTrackingLocation] = useState("");
  const [trackingRemarks, setTrackingRemarks] = useState("");
  const [addingTracking, setAddingTracking] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${API_BASE}/${orderId}`);
      const payload = res.data?.Data ?? res.data?.data ?? res.data;
      const order = mapOrderFromApi(payload.Order ?? payload.order ?? payload);
      const items = (payload.Items ?? payload.items ?? []).map(mapItemFromApi);
      const tracking = (payload.Tracking ?? payload.tracking ?? []).map(mapTrackingFromApi);

      setDetail({ order, items, tracking });
      setStatusDraft(order.orderStatus);
      setPaymentDraft(order.paymentStatus);
    } catch (err) {
      console.error("loadDetail failed:", err);
      setError("Couldn't load order details.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (!orderId) return null;

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    try {
      await api.put(`${API_BASE}/${orderId}/status`, {
        OrderStatus: statusDraft,
        Location: statusLocation || undefined,
        Remarks: statusRemarks || undefined,
      });
      notify("Order status updated.");
      setStatusRemarks("");
      await loadDetail();
      onChanged();
    } catch (err) {
      console.error(err);
      notify(
        err.response?.data?.message || "Couldn't update order status. Confirm that PUT /Orders/{id}/status is implemented.",
        "error"
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSavePayment = async () => {
    setSavingPayment(true);
    try {
      await api.put(`${API_BASE}/${orderId}/payment-status`, { PaymentStatus: paymentDraft });
      notify("Payment status updated.");
      await loadDetail();
      onChanged();
    } catch (err) {
      console.error(err);
      notify(
        err.response?.data?.message || "Couldn't update payment status. Confirm that PUT /Orders/{id}/payment-status is implemented.",
        "error"
      );
    } finally {
      setSavingPayment(false);
    }
  };

  const handleAddTracking = async () => {
    if (!trackingStatus) {
      notify("Pick a tracking status first.", "error");
      return;
    }
    setAddingTracking(true);
    try {
      await api.post(`${API_BASE}/${orderId}/tracking`, {
        Status: trackingStatus,
        Location: trackingLocation || undefined,
        Remarks: trackingRemarks || undefined,
      });
      notify("Tracking event added.");
      setTrackingStatus("");
      setTrackingLocation("");
      setTrackingRemarks("");
      await loadDetail();
      onChanged();
    } catch (err) {
      console.error(err);
      notify(
        err.response?.data?.message || "Couldn't add tracking event. Confirm that POST /Orders/{id}/tracking is implemented.",
        "error"
      );
    } finally {
      setAddingTracking(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          width: "min(920px, 96vw)",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 28,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, margin: 0 }}>
              {loading ? "Loading order..." : `Order ${detail?.order?.orderNumber || ""}`}
            </h2>
            {detail && (
              <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 6 }}>
                Placed {formatDate(detail.order.createdDate)}
              </p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {detail && canDownloadInvoice(detail.order.orderStatus) && (
              <button
                type="button"
                onClick={() => onDownloadInvoice(detail.order)}
                disabled={downloadingInvoice}
                style={{
                  ...secondaryButtonStyle,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  opacity: downloadingInvoice ? 0.6 : 1,
                }}
              >
                {downloadingInvoice ? <FaSpinner className="spin" /> : <FaDownload />}
                {downloadingInvoice ? "Downloading..." : "Download invoice"}
              </button>
            )}
            <button onClick={onClose} style={iconButtonStyle} aria-label="Close">
              <FaTimes />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>
            <FaSpinner className="spin" style={{ marginRight: 8 }} /> Loading...
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#f87171" }}>{error}</div>
        ) : (
          <>
            {/* SUMMARY */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 14,
                marginBottom: 24,
                padding: 16,
                background: "var(--surface2)",
                borderRadius: 10,
              }}
            >
              <SummaryStat label="Total" value={currency(detail.order.totalAmount)} />
              <SummaryStat label="Discount" value={currency(detail.order.discountAmount)} />
              <SummaryStat label="Tax" value={currency(detail.order.taxAmount)} />
              <SummaryStat label="Shipping" value={currency(detail.order.shippingCharge)} />
              <SummaryStat label="Final Amount" value={currency(detail.order.finalAmount)} bold />
              <SummaryStat label="Payment Method" value={detail.order.paymentMethod || "-"} />
            </div>

            {/* STATUS CONTROLS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={filterLabelStyle}>Order Status</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} style={inputStyle}>
                    {!ORDER_STATUS_OPTIONS.includes(statusDraft) && statusDraft && (
                      <option value={statusDraft}>{statusDraft}</option>
                    )}
                    {ORDER_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleSaveStatus}
                    disabled={savingStatus || statusDraft === detail.order.orderStatus}
                    style={{ ...primaryButtonStyle, whiteSpace: "nowrap" }}
                  >
                    {savingStatus ? <FaSpinner className="spin" /> : "Save"}
                  </button>
                </div>
                <input
                  value={statusLocation}
                  onChange={(event) => setStatusLocation(event.target.value)}
                  placeholder="Tracking location (optional)"
                  style={inputStyle}
                />
                <input
                  value={statusRemarks}
                  onChange={(event) => setStatusRemarks(event.target.value)}
                  placeholder="Status update remarks (optional)"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={filterLabelStyle}>
                  Payment Status{String(detail.order.paymentMethod).toUpperCase() === "COD" ? " (Cash on Delivery)" : ""}
                </label>
                {String(detail.order.paymentMethod).toUpperCase() === "COD" && (
                  <p style={{ margin: "0 0 4px", color: "var(--text2)", fontSize: 12 }}>
                    Mark as Paid only after the cash has been collected. The API should update both the order and payment record.
                  </p>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={paymentDraft} onChange={(e) => setPaymentDraft(e.target.value)} style={inputStyle}>
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleSavePayment}
                    disabled={savingPayment || paymentDraft === detail.order.paymentStatus}
                    style={{ ...primaryButtonStyle, whiteSpace: "nowrap" }}
                  >
                    {savingPayment ? <FaSpinner className="spin" /> : "Save"}
                  </button>
                </div>
              </div>
            </div>

            {/* ITEMS */}
            <h3 style={sectionHeadingStyle}>Items ({detail.items.length})</h3>
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
              {detail.items.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
                  No items on this order.
                </div>
              ) : (
                detail.items.map((it) => (
                  <div
                    key={it.orderItemId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: "var(--surface2)",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {it.imageUrl ? (
                        <img
                          src={it.imageUrl}
                          alt={it.productName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      ) : (
                        <FaBoxOpen color="var(--text2)" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{it.productName}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>{it.sku}</div>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)", width: 70, textAlign: "right" }}>
                      x{it.quantity}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)", width: 90, textAlign: "right" }}>
                      {currency(it.unitPrice)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, width: 100, textAlign: "right" }}>
                      {currency(it.totalPrice)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* TRACKING TIMELINE */}
            <h3 style={sectionHeadingStyle}>Tracking History</h3>
            <div style={{ marginBottom: 20 }}>
              {detail.tracking.length === 0 ? (
                <div style={{ padding: 16, color: "var(--text2)", fontSize: 13 }}>No tracking events yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {detail.tracking.map((t, idx) => (
                    <div key={t.trackingId} style={{ display: "flex", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "var(--accent)",
                            marginTop: 4,
                          }}
                        />
                        {idx < detail.tracking.length - 1 && (
                          <div style={{ width: 2, flex: 1, background: "var(--border)", minHeight: 24 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <StatusBadge value={t.status} />
                          <span style={{ fontSize: 12, color: "var(--text2)" }}>{formatDate(t.createdDate)}</span>
                        </div>
                        {t.location && (
                          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                            <FaMapMarkerAlt size={11} /> {t.location}
                          </div>
                        )}
                        {t.remarks && <div style={{ fontSize: 13, marginTop: 4 }}>{t.remarks}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ADD TRACKING EVENT */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
              <h3 style={sectionHeadingStyle}>Add Tracking Event</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <select value={trackingStatus} onChange={(e) => setTrackingStatus(e.target.value)} style={inputStyle}>
                  <option value="">Select status</option>
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  value={trackingLocation}
                  onChange={(e) => setTrackingLocation(e.target.value)}
                  placeholder="Location (optional)"
                  style={inputStyle}
                />
              </div>
              <textarea
                value={trackingRemarks}
                onChange={(e) => setTrackingRemarks(e.target.value)}
                placeholder="Remarks (optional)"
                rows={2}
                style={{ ...inputStyle, marginBottom: 12 }}
              />
              <button onClick={handleAddTracking} disabled={addingTracking} style={primaryButtonStyle}>
                {addingTracking ? (
                  <>
                    <FaSpinner className="spin" /> Adding...
                  </>
                ) : (
                  <>
                    <FaTruck /> Add Tracking Event
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, bold }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: bold ? 18 : 14, fontWeight: bold ? 700 : 600 }}>{value}</div>
    </div>
  );
}

// ==========================================
// CANCEL CONFIRM MODAL
// ==========================================

function CancelConfirmModal({ order, onCancel, onConfirm, cancelling }) {
  const [reason, setReason] = useState("");
  if (!order) return null;
  return (
    <div style={overlayStyle}>
      <div role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", width: "min(460px, 92vw)", padding: 26 }}>
        <h3 id="cancel-order-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 10 }}>Cancel Order</h3>
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 16 }}>
          Cancel order <strong>{order.orderNumber || `#${order.orderId}`}</strong>? Its status will change to Cancelled.
        </p>
        <label htmlFor="cancel-order-reason" style={filterLabelStyle}>Cancellation reason (optional)</label>
        <textarea
          id="cancel-order-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Add a note for the order history"
          style={{ ...inputStyle, resize: "vertical", marginBottom: 20 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" onClick={onCancel} disabled={cancelling} style={secondaryButtonStyle}>
            Keep Order
          </button>
          <button
            type="button"
            onClick={() => onConfirm(order, reason)}
            style={{ ...primaryButtonStyle, background: "#dc2626" }}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SHARED STYLES
// ==========================================

const inputStyle = {
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
  padding: 20,
};

const primaryButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 20px",
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "11px 20px",
  background: "var(--surface2)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const iconButtonStyle = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface2)",
  color: "var(--text2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const filterLabelStyle = {
  display: "block",
  fontSize: 11,
  color: "var(--text2)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 6,
};

const sectionHeadingStyle = {
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 12,
};

// ==========================================
// MAIN COMPONENT
// ==========================================

function OrderManage() {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 400);

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);

  const [toast, setToast] = useState(null);
  const notify = (message, type = "success") => setToast({ message, type });

  const abortRef = useRef(null);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = { page, pageSize };
    if (debouncedSearch) params.search = debouncedSearch;
    if (orderStatus) params.orderStatus = orderStatus;
    if (paymentStatus) params.paymentStatus = paymentStatus;
    if (paymentMethod) params.paymentMethod = paymentMethod;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    try {
      const res = await api.get(API_BASE, { params, signal: controller.signal });
      const payload = res.data?.Data ?? res.data?.data ?? res.data;
      const rows = payload?.items ?? payload?.Items ?? payload ?? [];
      const total = payload?.totalCount ?? payload?.TotalCount ?? (Array.isArray(rows) ? rows.length : 0);

      setOrders((Array.isArray(rows) ? rows : []).map(mapOrderFromApi));
      setTotalCount(total);
    } catch (err) {
      const cancelled = err.code === "ERR_CANCELED" || err.name === "CanceledError";
      if (!cancelled) {
        console.error("fetchOrders failed:", err);
        setError("Couldn't load orders. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, orderStatus, paymentStatus, paymentMethod, fromDate, toDate]);

  useEffect(() => {
    fetchOrders();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, orderStatus, paymentStatus, paymentMethod, fromDate, toDate, pageSize]);

  const resetFilters = () => {
    setSearch("");
    setOrderStatus("");
    setPaymentStatus("");
    setPaymentMethod("");
    setFromDate("");
    setToDate("");
  };

  const activeFilterCount = [orderStatus, paymentStatus, paymentMethod, fromDate, toDate].filter(Boolean).length;

  const handleDownloadInvoice = async (order) => {
    setDownloadingOrderId(order.orderId);
    try {
      const response = await api.get(`${API_BASE}/${order.orderId}/invoice`, { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      const filename = String(order.orderNumber || order.orderId).replace(/[^\w.-]/g, "_");
      link.href = url;
      link.download = `Invoice-${filename}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      notify("Invoice downloaded.");
    } catch (err) {
      console.error("handleDownloadInvoice failed:", err);
      const responseData = err.response?.data;
      let message = responseData?.message || responseData?.Message;
      if (responseData instanceof Blob) {
        const text = await responseData.text();
        if (text) {
          try {
            const payload = JSON.parse(text);
            message = payload.message || payload.Message || text;
          } catch {
            message = text;
          }
        }
      }
      notify(message || "Couldn't download the invoice. Please try again.", "error");
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const handleCancel = async (order, reason) => {
    if (!order?.orderId) {
      notify("This order is missing its order ID and cannot be cancelled.", "error");
      return;
    }
    setCancelling(true);
    try {
      const result = await orderService.cancelOrder(order.orderId, reason);
      if (result?.success === false) {
        throw new Error(result.message || "The API did not cancel this order.");
      }
      notify("Order cancelled.");
      setCancelTarget(null);
      if (orders.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await fetchOrders();
      }
    } catch (err) {
      console.error("handleCancel failed:", err);
      notify(err.response?.data?.message || err.message || "Couldn't cancel the order.", "error");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{ padding: "32px" }}>
      <style>{`
        .spin { animation: om-spin 0.9s linear infinite; }
        @keyframes om-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .om-row:hover { background: var(--surface2); }
        .om-icon-btn:hover { border-color: var(--accent); color: var(--accent); }
      `}</style>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginBottom: 6 }}>
            Manage Orders
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 15 }}>
            {totalCount.toLocaleString()} order{totalCount === 1 ? "" : "s"} placed.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <FaSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text2)", fontSize: 13 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number..."
              style={{ ...inputStyle, paddingLeft: 34 }}
            />
          </div>

          <button
            onClick={() => setShowFilters((s) => !s)}
            style={{
              ...secondaryButtonStyle,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: showFilters ? "var(--accent)" : "var(--surface2)",
              color: showFilters ? "#fff" : "var(--text)",
              borderColor: showFilters ? "var(--accent)" : "var(--border)",
            }}
          >
            <FaFilter /> Filters
            {activeFilterCount > 0 && (
              <span style={{ background: "#fff", color: "var(--accent)", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {(activeFilterCount > 0 || search) && (
            <button onClick={resetFilters} style={secondaryButtonStyle}>
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
            <div>
              <label style={filterLabelStyle}>Order Status</label>
              <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} style={inputStyle}>
                <option value="">All</option>
                {ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={filterLabelStyle}>Payment Status</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={inputStyle}>
                <option value="">All</option>
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={filterLabelStyle}>Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputStyle}>
                <option value="">All</option>
                {PAYMENT_METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={filterLabelStyle}>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={filterLabelStyle}>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Order #", "Date", "Amount", "Order Status", "Payment", "Method", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Actions" ? "right" : "left",
                      padding: "14px 16px",
                      color: "var(--text2)",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>
                    <FaSpinner className="spin" style={{ marginRight: 8 }} />
                    Loading orders...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#f87171" }}>
                    {error}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "var(--text2)" }}>
                    <FaBoxOpen size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
                    <div>No orders match these filters.</div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.orderId} className="om-row" style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600 }}>{o.orderNumber}</td>
                    <td style={{ padding: "14px 16px", color: "var(--text2)" }}>{formatDate(o.createdDate)}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 600 }}>{currency(o.finalAmount)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge value={o.orderStatus} />
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge value={o.paymentStatus} />
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text2)" }}>{o.paymentMethod || "-"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button
                          className="om-icon-btn"
                          title="View / Manage"
                          onClick={() => setSelectedOrderId(o.orderId)}
                          style={iconButtonStyle}
                        >
                          <FaEye />
                        </button>
                        <button
                          className="om-icon-btn"
                          title={
                            downloadingOrderId === o.orderId
                              ? "Downloading invoice..."
                              : canDownloadInvoice(o.orderStatus)
                                ? "Download invoice"
                                : "Invoice available after the order is confirmed"
                          }
                          aria-label="Download invoice"
                          onClick={() => handleDownloadInvoice(o)}
                          disabled={!canDownloadInvoice(o.orderStatus) || downloadingOrderId === o.orderId}
                          style={{
                            ...iconButtonStyle,
                            opacity: !canDownloadInvoice(o.orderStatus) || downloadingOrderId === o.orderId ? 0.45 : 1,
                            cursor: !canDownloadInvoice(o.orderStatus) || downloadingOrderId === o.orderId ? "not-allowed" : "pointer",
                          }}
                        >
                          {downloadingOrderId === o.orderId ? <FaSpinner className="spin" /> : <FaDownload />}
                        </button>
                        {canCancelOrder(o.orderStatus) && (
                          <button
                            className="om-icon-btn"
                            title="Cancel Order"
                            onClick={() => setCancelTarget(o)}
                            style={{ ...iconButtonStyle, color: "#f87171" }}
                          >
                            <FaBan />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text2)" }}>
            <span>Rows per page</span>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ ...inputStyle, padding: "6px 10px", width: "auto" }}>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>
              {totalCount === 0 ? "0 results" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ ...iconButtonStyle, opacity: page <= 1 ? 0.4 : 1 }}>
              <FaChevronLeft />
            </button>
            <span style={{ fontSize: 13, color: "var(--text2)", minWidth: 90, textAlign: "center" }}>
              Page {page} of {totalPages}
            </span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ ...iconButtonStyle, opacity: page >= totalPages ? 0.4 : 1 }}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onChanged={fetchOrders}
          onDownloadInvoice={handleDownloadInvoice}
          downloadingInvoice={downloadingOrderId === selectedOrderId}
          notify={notify}
        />
      )}

      <CancelConfirmModal
        key={cancelTarget?.orderId ?? "cancel-order"}
        order={cancelTarget}
        cancelling={cancelling}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default OrderManage;
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBoxOpen, FaChevronRight } from "react-icons/fa";
import orderService from "../../../services/orderService";

const STATUS_COLORS = {
  Pending: "#d97706",
  Approved: "#2563eb",
  Dispatched: "#7c3aed",
  Delivered: "#16a34a",
  Rejected: "#dc2626",
  Cancelled: "#6b7280",
};

function orderListFromResponse(response) {
  let payload = response?.data ?? response;
  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    const rows = payload.orders ?? payload.Orders ?? payload.items ?? payload.Items;
    if (Array.isArray(rows)) return rows;
    const nested = payload.data ?? payload.Data;
    if (nested === undefined || nested === payload) return [];
    payload = nested;
  }
  return [];
}

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await orderService.getMyOrders();
        setOrders(orderListFromResponse(res));
      } catch (err) {
        console.error("getMyOrders failed:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80, color: "var(--text2)" }}>
        Loading your orders…
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 64px", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, marginBottom: 28 }}>My Orders</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <FaBoxOpen size={48} style={{ color: "var(--text2)", marginBottom: 16 }} />
          <p style={{ color: "var(--text2)", marginBottom: 20 }}>You haven't placed any orders yet.</p>
          <Link to="/products">
            <button style={{ padding: "12px 28px", background: "var(--accent)", color: "white", border: "none", borderRadius: 50, fontWeight: 600, cursor: "pointer" }}>
              Start Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.map((order) => {
            const id = order.id ?? order.orderId ?? order.OrderId ?? order.Id;
            const status = String(order.orderStatus ?? order.OrderStatus ?? order.status ?? order.Status ?? "Pending");
            const total = order.finalAmount ?? order.FinalAmount ?? order.totalAmount ?? order.TotalAmount ?? order.total ?? order.Total ?? 0;
            const items = order.items ?? order.Items ?? order.orderItems ?? order.OrderItems ?? [];
            const itemCount = Array.isArray(items) ? items.length : 0;
            const date = order.orderDate ?? order.OrderDate ?? order.createdDate ?? order.CreatedDate ?? order.createdAt ?? order.CreatedAt;
            const statusColor = Object.entries(STATUS_COLORS)
              .find(([label]) => label.toLowerCase() === status.toLowerCase())?.[1] ?? "var(--text2)";
            return (
              <Link
                key={id}
                to={`/orders/${id}`}
                style={{
                  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
                  padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
                  color: "inherit", textDecoration: "none", gap: 16,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Order #{id}</div>
                  <div style={{ fontSize: 13, color: "var(--text2)" }}>
                    {itemCount} item(s) · ₹{Number(total).toFixed(2)}
                    {date && ` · ${new Date(date).toLocaleDateString()}`}
                  </div>
                  <div style={{ color: "var(--accent)", fontSize: 12, marginTop: 6, fontWeight: 600 }}>
                    View order details and delivery tracking
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{status}</span>
                  <FaChevronRight size={13} style={{ color: "var(--text2)" }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;

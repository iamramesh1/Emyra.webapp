import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaPlus,
  FaShoppingBag,
  FaSyncAlt,
  FaTruck,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { digitalApi } from "../../services/apiInstances";
import orderService from "../../services/orderService";
import b2bService from "../Website/b2b/b2bService";
import "./dashboard.css";

const getField = (record, ...names) => {
  for (const name of names) {
    if (record?.[name] !== undefined && record?.[name] !== null) return record[name];
  }
  return undefined;
};

const unwrap = (value) => {
  let current = value;
  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(current) || !current || typeof current !== "object") break;
    const nested = current.Data ?? current.data;
    if (nested === undefined || nested === current) break;
    current = nested;
  }
  return current;
};

const readList = (value) => {
  const payload = unwrap(value);
  if (Array.isArray(payload)) return payload;
  const rows = payload?.items ?? payload?.Items ?? payload?.orders ?? payload?.Orders;
  return Array.isArray(rows) ? rows : [];
};

const readTotal = (value, fallback) => {
  const payload = unwrap(value);
  const total = payload?.totalCount ?? payload?.TotalCount ?? payload?.total ?? payload?.Total;
  return Number.isFinite(Number(total)) ? Number(total) : fallback;
};

const normalizedStatus = (value) => String(value || "").trim().toLowerCase().replace(/[\s_-]/g, "");

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatDate = (value) => {
  if (!value) return "Date not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not available"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [data, setData] = useState({
    orders: [],
    orderTotal: null,
    products: [],
    productTotal: null,
    enquiries: null,
    b2bStats: null,
  });
  const [errors, setErrors] = useState([]);

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);
    const [ordersResult, productsResult, enquiriesResult, b2bResult] = await Promise.allSettled([
      orderService.getOrders(),
      digitalApi.get("/Product/GetAllAdmin", { params: { page: 1, pageSize: 100 } }),
      b2bService.getAll({ page: 1, pageSize: 8 }),
      b2bService.getDashboard(),
    ]);

    const nextErrors = [];
    const nextData = {
      orders: [],
      orderTotal: null,
      products: [],
      productTotal: null,
      enquiries: null,
      b2bStats: null,
    };

    if (ordersResult.status === "fulfilled") {
      nextData.orders = readList(ordersResult.value);
      nextData.orderTotal = readTotal(ordersResult.value, nextData.orders.length);
    } else {
      console.error("Dashboard order load failed:", ordersResult.reason);
      nextErrors.push("Orders and payment totals");
    }

    if (productsResult.status === "fulfilled") {
      const response = productsResult.value;
      nextData.products = readList(response);
      nextData.productTotal = readTotal(response, nextData.products.length);
    } else {
      console.error("Dashboard product load failed:", productsResult.reason);
      nextErrors.push("Product catalogue and approvals");
    }

    if (enquiriesResult.status === "fulfilled") {
      nextData.enquiries = readList(enquiriesResult.value);
    } else {
      console.error("Dashboard enquiry load failed:", enquiriesResult.reason);
      nextErrors.push("Recent B2B enquiries");
    }

    if (b2bResult.status === "fulfilled") {
      nextData.b2bStats = unwrap(b2bResult.value);
    } else {
      console.error("Dashboard B2B metrics load failed:", b2bResult.reason);
      nextErrors.push("B2B summary");
    }

    setData(nextData);
    setErrors(nextErrors);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, reloadKey]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => setReloadKey((key) => key + 1), 60000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const metrics = useMemo(() => {
    const orders = data.orders;
    const products = data.products;
    const paidOrders = orders.filter((order) =>
      ["paid", "success", "successful", "completed"].includes(
        normalizedStatus(getField(order, "PaymentStatus", "paymentStatus"))
      )
    );
    const pendingOrders = orders.filter((order) =>
      ["pending", "submitted", "awaitingapproval", "awaitingpayment"].includes(
        normalizedStatus(getField(order, "OrderStatus", "orderStatus", "Status", "status"))
      )
    );
    const awaitingPayment = orders.filter((order) =>
      ["pending", "failed", "unpaid"].includes(
        normalizedStatus(getField(order, "PaymentStatus", "paymentStatus"))
      )
    );
    const awaitingApproval = products.filter((product) => {
      const status = normalizedStatus(getField(product, "Status", "status"));
      const approved = getField(product, "IsApproved", "isApproved", "Approved", "approved");
      return ["pending", "submitted", "draft", "awaitingapproval"].some((value) => status.includes(value)) || approved === false;
    });
    const revenue = paidOrders.reduce(
      (sum, order) => sum + Number(getField(order, "FinalAmount", "finalAmount", "TotalAmount", "totalAmount") || 0),
      0
    );
    const b2b = data.b2bStats || {};

    return [
      { label: "Orders", value: data.orderTotal, icon: FaShoppingBag, tone: "blue", note: `${pendingOrders.length} awaiting action`, to: "/Ordermanage" },
      { label: "Paid revenue", value: data.orderTotal === null ? null : currency(revenue), icon: FaMoneyBillWave, tone: "green", note: `${paidOrders.length} paid orders`, to: "/Ordermanage" },
      { label: "Payment follow-up", value: data.orderTotal === null ? null : awaitingPayment.length, icon: FaClock, tone: "amber", note: "Pending or failed payments", to: "/Ordermanage" },
      { label: "Products", value: data.productTotal, icon: FaBoxOpen, tone: "purple", note: `${awaitingApproval.length} awaiting approval`, to: "/ProductManagement" },
      { label: "B2B enquiries", value: getField(b2b, "total", "Total") ?? (data.enquiries ? data.enquiries.length : null), icon: FaFileInvoiceDollar, tone: "teal", note: `${getField(b2b, "submitted", "Submitted") ?? (data.b2bStats ? 0 : "—")} submitted for review`, to: "/admin/b2b/enquiries" },
      { label: "B2B orders", value: getField(b2b, "orders", "Orders") ?? (data.b2bStats ? 0 : null), icon: FaTruck, tone: "rose", note: `${getField(b2b, "shipped", "Shipped") ?? (data.b2bStats ? 0 : "—")} shipped`, to: "/admin/b2b/enquiries?status=CONVERTED_TO_ORDER" },
    ];
  }, [data]);

  const recentOrders = [...data.orders]
    .sort((a, b) => new Date(getField(b, "CreatedDate", "createdDate") || 0) - new Date(getField(a, "CreatedDate", "createdDate") || 0))
    .slice(0, 6);
  const recentEnquiries = (data.enquiries || []).slice(0, 6);
  const name = user?.name || user?.Name || "Admin";

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-hero">
        <div>
          <p className="admin-dashboard-eyebrow">STORE OPERATIONS</p>
          <h1>Welcome back, {name}</h1>
          <p>Monitor sales, orders, payments, product approvals, and business enquiries from one place.</p>
        </div>
        <div className="admin-dashboard-hero-actions">
          <span className="admin-dashboard-updated">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Loading live data"}
          </span>
          <button type="button" className="admin-dashboard-refresh" onClick={() => setReloadKey((key) => key + 1)} disabled={refreshing}>
            <FaSyncAlt className={refreshing ? "admin-spin" : ""} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </section>

      {errors.length > 0 && (
        <div className="admin-dashboard-alert" role="alert">
          <FaExclamationTriangle />
          <span>Some live data could not be loaded: {errors.join(", ")}. Check the relevant API connection and refresh.</span>
        </div>
      )}

      <section className="admin-dashboard-metrics" aria-label="Store metrics">
        {metrics.map(({ label, value, icon: Icon, tone, note, to }) => (
          <Link className="admin-metric-card" to={to} key={label}>
            <span className={`admin-metric-icon ${tone}`}><Icon /></span>
            <span className="admin-metric-label">{label}</span>
            <strong>{refreshing && value === null ? "…" : value ?? "—"}</strong>
            <span className="admin-metric-note">{note}</span>
          </Link>
        ))}
      </section>

      <section className="admin-dashboard-actions">
        <div className="admin-dashboard-section-heading">
          <div>
            <p className="admin-dashboard-eyebrow">QUICK ACCESS</p>
            <h2>Manage your store</h2>
          </div>
        </div>
        <div className="admin-action-grid">
          <Link to="/ProductManagement"><FaBoxOpen /><span><strong>Products & approvals</strong><small>Create, edit, approve, reject, and manage stock</small></span><FaPlus className="admin-action-arrow" /></Link>
          <Link to="/Ordermanage"><FaShoppingBag /><span><strong>Orders, payments & tracking</strong><small>Review orders, update payment, status, and shipment events</small></span><FaPlus className="admin-action-arrow" /></Link>
          <Link to="/admin/b2b/enquiries"><FaFileInvoiceDollar /><span><strong>B2B enquiries & quotations</strong><small>Review requests, prepare quotations, and manage bulk orders</small></span><FaPlus className="admin-action-arrow" /></Link>
          <Link to="/users"><FaCheckCircle /><span><strong>Customer accounts</strong><small>View and manage registered users</small></span><FaPlus className="admin-action-arrow" /></Link>
        </div>
      </section>

      <section className="admin-dashboard-lists">
        <div className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-heading">
            <div><p className="admin-dashboard-eyebrow">LATEST ACTIVITY</p><h2>Recent orders</h2></div>
            <Link to="/Ordermanage">Manage orders →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="admin-dashboard-empty">{refreshing ? "Loading orders…" : data.orderTotal === null ? "Order data is unavailable." : "No orders to show yet."}</p>
          ) : (
            <div className="admin-dashboard-table-wrap">
              <table className="admin-dashboard-table">
                <thead><tr><th>Order</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th></tr></thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr key={getField(order, "OrderId", "orderId") ?? index}>
                      <td>#{getField(order, "OrderNumber", "orderNumber", "OrderId", "orderId") ?? "—"}</td>
                      <td>{formatDate(getField(order, "CreatedDate", "createdDate"))}</td>
                      <td>{currency(getField(order, "FinalAmount", "finalAmount", "TotalAmount", "totalAmount"))}</td>
                      <td>{getField(order, "PaymentStatus", "paymentStatus") || "Unknown"}</td>
                      <td><span className="admin-dashboard-status">{getField(order, "OrderStatus", "orderStatus", "Status", "status") || "Unknown"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-dashboard-panel">
          <div className="admin-dashboard-panel-heading">
            <div><p className="admin-dashboard-eyebrow">BUSINESS CUSTOMERS</p><h2>Recent B2B enquiries</h2></div>
            <Link to="/admin/b2b/enquiries">View all →</Link>
          </div>
          {recentEnquiries.length === 0 ? (
            <p className="admin-dashboard-empty">{refreshing ? "Loading enquiries…" : errors.includes("Recent B2B enquiries") ? "Enquiry data is unavailable." : "No recent enquiries."}</p>
          ) : (
            <div className="admin-dashboard-enquiry-list">
              {recentEnquiries.map((enquiry, index) => {
                const enquiryId = getField(enquiry, "b2bEnquiryId", "B2BEnquiryId", "id", "Id");
                return (
                  <Link
                    to={enquiryId ? `/admin/b2b/enquiries/${enquiryId}` : "/admin/b2b/enquiries"}
                    key={enquiryId ?? index}
                  >
                    <span className="admin-enquiry-icon"><FaFileInvoiceDollar /></span>
                    <span className="admin-enquiry-copy">
                      <strong>{getField(enquiry, "companyName", "CompanyName") || "Business enquiry"}</strong>
                      <small>{getField(enquiry, "productCategory", "Category", "category") || "Product request"} · {formatDate(getField(enquiry, "createdDate", "CreatedDate"))}</small>
                    </span>
                    <span className="admin-dashboard-status">{getField(enquiry, "status", "Status") || "Submitted"}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

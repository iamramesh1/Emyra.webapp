import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPlus,
  FaCheckCircle,
  FaSpinner,
  FaMoneyBillWave,
  FaCreditCard,
} from "react-icons/fa";

import cartService from "../../../services/cartService";
import checkoutService from "../../../services/checkoutService";
import orderService from "../../../services/orderService";
import paymentService from "../../../services/paymentService";
import shipmentService from "../../../services/shipmentService";
import productService from "../../../services/productService";
import PaymentModal from "./PaymentModel";

const emptyAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const getAddressId = (addr) => addr?.addressId ?? addr?.id ?? addr?.Id;
const isLoggedIn = () => !!localStorage.getItem("accessToken");

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If a productId is present, this is a "Buy Now" checkout scoped to
  // just that item; otherwise it's a normal full-cart checkout.
  const productId = searchParams.get("productId");

  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAddress);

  const [paymentMethod, setPaymentMethod] = useState("COD"); // "COD" | "ONLINE"
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [checkoutItems, addressList] = await Promise.all([
        productId
          ? productService.getProduct(productId).then((product) => {
              if (!product) throw new Error("Product was not found.");
              const id = product.id ?? product.Id ?? product.productId ?? product.ProductId ?? productId;
              return [{
                id,
                productId: id,
                title: product.title ?? product.Title ?? product.productName ?? product.ProductName ?? "Product",
                category: product.category ?? product.Category ?? "",
                image: product.image ?? product.Image ?? product.imageurl ?? product.ImageUrl ?? "",
                price: Number(product.price ?? product.Price ?? 0),
                quantity: 1,
              }];
            })
          : cartService.getCart(),
        checkoutService.getAddresses(),
      ]);
      setCart(checkoutItems);
      setAddresses(addressList || []);

      const defaultAddr =
        (addressList || []).find((a) => a.isDefault) ?? (addressList || [])[0];
      if (defaultAddr) {
        setSelectedId(getAddressId(defaultAddr));
      } else {
        setShowForm(true);
      }
    } catch (err) {
      console.error("Checkout load failed", err);
      setError("Couldn't load your checkout details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // ── Step 1: must be logged in before anything else ────────────────────
  useEffect(() => {
    if (!isLoggedIn()) {
      const redirect = productId ? `/checkout?productId=${encodeURIComponent(productId)}` : "/checkout";
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    Promise.resolve().then(loadAll);
  }, [loadAll, navigate, productId]);

  // ── Totals ──────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = subtotal * 0.1;
  const total = subtotal - discount;

  // ── Address form handlers ──────────────────────────────────────────
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setForm(emptyAddress);
    setShowForm(false);
  };

  const submitAddress = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await checkoutService.addAddress(form);
      const newId = getAddressId(saved);
      await loadAll();
      if (newId) setSelectedId(newId);
      setShowForm(false);
      setForm(emptyAddress);
    } catch (err) {
      console.error("addAddress failed", err);
      setError("Couldn't save that address. Please check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id) => {
    try {
      await checkoutService.deleteAddress(id);
      if (selectedId === id) setSelectedId(null);
      await loadAll();
    } catch (err) {
      console.error("deleteAddress failed", err);
      setError("Couldn't remove that address.");
    }
  };

  // ── Order → Payment → Shipment pipeline ─────────────────────────────
  const buildOrderPayload = () => ({
    addressId: selectedId,
    items: cart.map((i) => ({
      productId: i.productId ?? i.id,
      quantity: i.quantity,
      price: i.price,
    })),
    subtotal,
    discount,
    total,
    paymentMethod,
  });

  // A direct purchase is sourced from the catalog and never mutates the cart.
  const cleanupCart = async () => {
    if (productId) return;

    try {
      await cartService.clearCart();
    } catch (err) {
      console.warn("Cart cleanup after order failed (non-fatal):", err);
    }
  };

  const createShipmentForOrder = async (orderId) => {
    try {
      await shipmentService.createShipment({
        orderId: Number(orderId),
        courierName: null,
        trackingNumber: null,
        shipmentStatus: "PENDING",
        estimatedDeliveryDate: null,
        remarks: "Order placed successfully",
      });
    } catch (err) {
      // Non-fatal: the order still exists even if shipment creation lags.
      console.warn("createShipment failed (non-fatal):", err);
    }
  };

  /** Places the order itself. Returns the new orderId. */
  const placeOrderOnly = async () => {
    const orderResponse = await orderService.createOrder(buildOrderPayload());
    const payload = orderResponse?.data ?? orderResponse;
    const order =
      payload?.data?.order ??
      payload?.data?.Order ??
      payload?.order ??
      payload?.Order ??
      payload;
    const orderId = order?.id ?? order?.orderId ?? order?.Id ?? order?.OrderId;
    if (orderId == null || orderId === "") {
      throw new Error("Order ID was not returned by the API.");
    }
    return orderId;
  };

  const handlePlaceOrder = async () => {
    if (!selectedId) {
      setError("Please select or add a delivery address.");
      return;
    }
    if (!cart || cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setError("");
    setPlacing(true);

    try {
      const orderId = await placeOrderOnly();

      if (paymentMethod === "ONLINE") {
        // Order is created PENDING; open the payment modal against it.
        setPendingOrderId(orderId);
        setShowPaymentModal(true);
        setPlacing(false);
        return;
      }

      // Cash on Delivery: record the payment as pending-on-delivery, ship it.
      await paymentService.createPayment({
        orderId: Number(orderId),
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        transactionId: null,
        amount: Number(total.toFixed(2)),
      });
      await createShipmentForOrder(orderId);
      await cleanupCart();
      navigate(`/orders/${orderId}`);
    } catch (err) {
      console.error("Order placement failed:", err);
      setError(err?.response?.data?.message ?? err.message ?? "Something went wrong while placing your order.");
      setPlacing(false);
    }
  };

  const handlePaymentSuccess = async (transactionId) => {
    setShowPaymentModal(false);
    setPlacing(true);
    try {
      // Razorpay verification/QR confirmation records the payment server-side.
      // Do not create a second payment row from the browser callback.
      if (!transactionId) throw new Error("The payment service did not confirm a transaction.");
      await createShipmentForOrder(pendingOrderId);
      await cleanupCart();
      navigate(`/orders/${pendingOrderId}`);
    } catch (err) {
      console.error("Recording payment failed:", err);
      setError("Payment succeeded but we couldn't finish placing your order. Please contact support with your order id: " + pendingOrderId);
    } finally {
      setPlacing(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <div style={{ color: "var(--text2)", fontSize: 16 }}>Loading checkout…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 64px", maxWidth: 1100, margin: "0 auto" }}>
      <Link
        to="/cart"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text2)", fontSize: 14, marginBottom: 32 }}
      >
        <FaArrowLeft /> Back to Cart
      </Link>

      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, marginBottom: 32 }}>
        Checkout
      </h1>

      {productId && (
        <div style={{ background: "rgba(217,119,87,0.08)", border: "1px solid var(--accent)", borderRadius: 10, padding: "10px 16px", marginBottom: 24, fontSize: 13, color: "var(--accent)" }}>
          You're buying this item directly — the rest of your cart is untouched.
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(255,68,85,0.1)", border: "1px solid #ff4455", color: "#ff4455", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 14 }}>
          {error}
          {error === "Couldn't load your checkout details. Please try again." && (
            <button
              onClick={() => { setLoading(true); setError(""); loadAll(); }}
              style={{ marginLeft: 12, background: "transparent", border: "1px solid #ff4455", color: "#ff4455", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
            >
              Try Again
            </button>
          )}
          {pendingOrderId && paymentMethod === "ONLINE" && (
            <button
              onClick={() => setShowPaymentModal(true)}
              style={{ marginLeft: 12, background: "transparent", border: "1px solid #ff4455", color: "#ff4455", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
            >
              Retry Payment
            </button>
          )}
        </div>
      )}

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--text2)", marginBottom: 20 }}>There's nothing to check out yet.</p>
          <Link to="/products">
            <button style={{ padding: "12px 28px", background: "var(--accent)", color: "white", border: "none", borderRadius: 50, fontWeight: 600, cursor: "pointer" }}>
              Browse Products
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>

          {/* ── Left: addresses + payment method ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

            {/* Address section */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 4 }}>
                Delivery Address
              </h3>

              {addresses.map((addr) => {
                const id = getAddressId(addr);
                const isSelected = selectedId === id;
                return (
                  <div
                    key={id}
                    onClick={() => setSelectedId(id)}
                    style={{
                      background: "var(--surface)",
                      border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      padding: 20,
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                      cursor: "pointer",
                    }}
                  >
                    <FaMapMarkerAlt size={18} style={{ color: isSelected ? "var(--accent)" : "var(--text2)", marginTop: 3 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                        {addr.fullName} · {addr.phone}
                      </div>
                      <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.5 }}>
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} - {addr.pincode}
                      </div>
                    </div>
                    {isSelected && <FaCheckCircle size={18} style={{ color: "var(--accent)" }} />}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAddress(id); }}
                      style={{ background: "transparent", border: "none", color: "var(--text2)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}

              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "14px", background: "var(--surface2)", border: "1px dashed var(--border)",
                    borderRadius: "var(--radius)", color: "var(--text)", fontSize: 15, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <FaPlus size={13} /> Add New Address
                </button>
              ) : (
                <form
                  onSubmit={submitAddress}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
                >
                  <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} required style={inputStyle} />
                  <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required style={inputStyle} />
                  <input name="line1" placeholder="Address Line 1" value={form.line1} onChange={handleChange} required style={{ ...inputStyle, gridColumn: "1 / -1" }} />
                  <input name="line2" placeholder="Address Line 2 (optional)" value={form.line2} onChange={handleChange} style={{ ...inputStyle, gridColumn: "1 / -1" }} />
                  <input name="city" placeholder="City" value={form.city} onChange={handleChange} required style={inputStyle} />
                  <input name="state" placeholder="State" value={form.state} onChange={handleChange} required style={inputStyle} />
                  <input name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} required style={inputStyle} />

                  <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, marginTop: 8 }}>
                    <button type="submit" disabled={saving} style={{ flex: 1, padding: "12px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                      {saving ? "Saving…" : "Save Address"}
                    </button>
                    {addresses.length > 0 && (
                      <button type="button" onClick={resetForm} style={{ padding: "12px 20px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, fontSize: 15, cursor: "pointer", color: "var(--text)" }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Payment method section */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 4 }}>
                Payment Method
              </h3>

              <div
                onClick={() => setPaymentMethod("COD")}
                style={{
                  background: "var(--surface)",
                  border: paymentMethod === "COD" ? "2px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: 18, display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                }}
              >
                <FaMoneyBillWave size={18} style={{ color: paymentMethod === "COD" ? "var(--accent)" : "var(--text2)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Cash on Delivery</div>
                  <div style={{ fontSize: 13, color: "var(--text2)" }}>Pay when your order arrives</div>
                </div>
                {paymentMethod === "COD" && <FaCheckCircle size={18} style={{ color: "var(--accent)" }} />}
              </div>

              <div
                onClick={() => setPaymentMethod("ONLINE")}
                style={{
                  background: "var(--surface)",
                  border: paymentMethod === "ONLINE" ? "2px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: 18, display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                }}
              >
                <FaCreditCard size={18} style={{ color: paymentMethod === "ONLINE" ? "var(--accent)" : "var(--text2)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Card / UPI / Netbanking (Razorpay)</div>
                  <div style={{ fontSize: 13, color: "var(--text2)" }}>Pay now, securely online</div>
                </div>
                {paymentMethod === "ONLINE" && <FaCheckCircle size={18} style={{ color: "var(--accent)" }} />}
              </div>
            </div>
          </div>

          {/* ── Right: order summary ── */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28, position: "sticky", top: 100 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 24 }}></h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, maxHeight: 240, overflowY: "auto" }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text2)" }}>
                  <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title} × {item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 24, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--text2)" }}>
                <span>Subtotal ({cart.length} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--success)" }}>
                <span>Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--text2)" }}>
                <span>Shipping</span>
                <span style={{ color: "var(--success)" }}>FREE</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
              <span>Total</span>
              <span style={{ color: "var(--accent)" }}>₹{total.toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || cart.length === 0}
              style={{
                width: "100%", padding: "14px", background: "var(--accent)", color: "white",
                border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700,
                cursor: placing ? "not-allowed" : "pointer", letterSpacing: 0.5,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                opacity: placing || cart.length === 0 ? 0.7 : 1,
              }}
            >
              {placing ? (<><FaSpinner className="spin" /> Placing Order…</>) : (paymentMethod === "ONLINE" ? "Continue to Payment →" : "Place Order →")}
            </button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          orderId={pendingOrderId}
          amount={total}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

const inputStyle = {
  padding: "11px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface2)",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
};

export default Checkout;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTrash, FaArrowLeft, FaShoppingBag } from "react-icons/fa";
import cartService from "../../../services/cartService";
import productService from "../../../services/productService";
import { showError } from "../../../shared/utils/alert";
import "./cart.css";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState([]);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      const items = await cartService.getCart();
      const needsCatalogImages = items.some((item) => (item.images?.length ?? 0) < 2);
      if (needsCatalogImages) {
        try {
          const products = await productService.getProducts();
          const productsById = new Map(
            products.map((product) => [String(product.id), product])
          );
          setCart(items.map((item) => {
            const product = productsById.get(String(item.productId ?? item.id));
            if (!product) return item;
            const catalogImages = product.imageUrls ?? product.images ?? [];
            const images = catalogImages.length ? catalogImages : item.images ?? [];
            return {
              ...item,
              title: item.title || product.productName,
              category: item.category || product.category,
              image: catalogImages.includes(item.image)
                ? item.image
                : product.image || item.image || images[0] || "",
              images,
            };
          }));
          return;
        } catch (error) {
          console.error("Could not load catalogue images for cart items:", error);
        }
      }
      setCart(items);
    } catch (error) {
      console.error("Could not load cart:", error);
      showError("Cart Error", "Couldn't load your cart. Please try again.");
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadCart();
    })();
  }, []);

  const remove = async (id, cartItemId) => {
    if (updatingIds.includes(id)) return;
    setUpdatingIds((current) => [...current, id]);
    try {
      await cartService.removeCartItem(id, cartItemId);
    } catch {
      showError("Error", "Couldn't remove that item. Please try again.");
    } finally {
      setLoading(true);
      await loadCart();
      setUpdatingIds((current) => current.filter((itemId) => String(itemId) !== String(id)));
    }
  };

  const updateQty = async (item, delta) => {
    const currentQty = Math.max(1, Number(item.quantity) || 1);
    const newQty = Math.max(1, currentQty + delta);
    if (newQty === currentQty || updatingIds.includes(item.id)) return;
    setUpdatingIds((current) => [...current, item.id]);
    setCart((prev) => prev.map((cartItem) =>
      String(cartItem.id) === String(item.id) ? { ...cartItem, quantity: newQty } : cartItem
    ));
    try {
      await cartService.updateQuantity(item.id, newQty, item.cartItemId);
    } catch {
      showError("Error", "Couldn't update quantity.");
      setLoading(true);
      await loadCart();
    } finally {
      setUpdatingIds((current) => current.filter((id) => String(id) !== String(item.id)));
    }
  };

  const goToCheckout = () => {
    if (!localStorage.getItem("accessToken")) {
      navigate("/login?redirect=/checkout");
      return;
    }
    navigate("/checkout");
  };

  const subtotal = cart.reduce((s, i) => s + Number(i.price || 0) * Math.max(1, Number(i.quantity) || 1), 0);
  const discount = subtotal * 0.1;
  const total = subtotal - discount;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <div style={{ color: "var(--text2)", fontSize: 16 }}>Loading cart…</div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Link
        to="/products"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text2)", fontSize: 14, marginBottom: 32 }}
      >
        <FaArrowLeft /> Continue Shopping
      </Link>

      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, marginBottom: 32 }}>
        Your Cart
      </h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <FaShoppingBag size={64} style={{ color: "var(--text2)", marginBottom: 20 }} />
          <h3 style={{ fontSize: 22, marginBottom: 12 }}>Your cart is empty</h3>
          <p style={{ color: "var(--text2)", marginBottom: 28 }}>Add some products to get started!</p>
          <Link to="/products">
            <button style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 50, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Shop Now
            </button>
          </Link>
        </div>
      ) : (
        <div className="cart-layout">

          {/* ── Line items ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {cart.map((item) => (
              <div
                key={item.id ?? item.productId}
                className="cart-item"
              >
                <div className="cart-item-media">
                  {item.image ? (
                    <img
                      className="cart-item-image"
                      src={item.image}
                      alt={item.title}
                      onError={(event) => { event.currentTarget.hidden = true; }}
                    />
                  ) : (
                    <div className="cart-item-image-placeholder" aria-label="Product image unavailable">
                      No image
                    </div>
                  )}
                  {item.images?.length > 1 && (
                    <div className="cart-image-thumbnails" aria-label={`${item.title} images`}>
                      {item.images.map((image, index) => (
                        <button
                          type="button"
                          key={`${image}-${index}`}
                          className={image === item.image ? "active" : ""}
                          aria-label={`Show product image ${index + 1}`}
                          onClick={() => {
                            setCart((current) => current.map((cartItem) =>
                              String(cartItem.id) === String(item.id)
                                ? { ...cartItem, image }
                                : cartItem
                            ));
                          }}
                        >
                          <img src={image} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cart-item-details">
                  <div style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600, marginBottom: 4 }}>
                    {item.category}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, lineHeight: 1.4 }}>
                    {item.title?.slice(0, 60)}{item.title?.length > 60 ? "…" : ""}
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>
                    ₹{(Number(item.price || 0) * Math.max(1, Number(item.quantity) || 1)).toFixed(2)}
                  </div>
                </div>

                <div className="cart-quantity-control" aria-label={`Quantity for ${item.title}`}>
                  <button type="button" onClick={() => updateQty(item, -1)} disabled={Number(item.quantity) <= 1 || updatingIds.includes(item.id)} aria-label="Decrease quantity">
                    −
                  </button>
                  <span aria-live="polite">{item.quantity}</span>
                  <button type="button" onClick={() => updateQty(item, 1)} disabled={updatingIds.includes(item.id)} aria-label="Increase quantity">
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => remove(item.id, item.cartItemId)}
                  disabled={updatingIds.includes(item.id)}
                  aria-label={`Remove ${item.title} from cart`}
                  className="cart-remove-button"
                  style={{ width: 36, height: 36, background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "#ff4455", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <FaTrash size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* ── Order summary ── */}
          <div className="cart-summary">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 24 }}>Order Summary</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 24 }}>
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
              onClick={goToCheckout}
              style={{
                width: "100%",
                padding: "14px",
                background: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              Proceed to Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

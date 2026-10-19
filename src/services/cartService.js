// =====================================================================
// CART SERVICE
// Guest users  -> cart lives in localStorage ("cart" key)
// Logged-in    -> cart lives server-side, via the common `digitalApi`
//                 instance (handles auth header + token refresh).
//
// Guest cart automatically merges into the server cart on login
// (see mergeGuestCart, called from the login flow).
// =====================================================================

import { digitalApi as api } from "./apiInstances";

const getToken = () => localStorage.getItem("accessToken");
const isLoggedIn = () => !!getToken();

const LOCAL_KEY = "cart";
const notifyCartUpdated = () => window.dispatchEvent(new Event("cartUpdated"));

const localCart = {
  get() {
    try {
      const value = localStorage.getItem(LOCAL_KEY);
      if (!value || value === "undefined") return [];
      return JSON.parse(value);
    } catch (error) {
      console.error("Invalid local cart:", error);
      return [];
    }
  },
  set(cart) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(cart));
  },
  clear() {
    localStorage.removeItem(LOCAL_KEY);
  },
};

// Server rows can come back in PascalCase or camelCase depending on the
// controller - normalize both into one shape the UI relies on.
const imageList = (value) => {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  }
  return Array.isArray(value) ? value : [value];
};

const mapApiItem = (row) => {
  const product = row.Product ?? row.product ?? row.ProductDetails ?? row.productDetails ?? {};
  const cartItemId = row.CartItemId ?? row.cartItemId ?? row.CartId ?? row.cartId ?? row.Id ?? row.id;
  const productId = row.ProductId ?? row.productId ?? product.ProductId ?? product.productId ?? product.Id ?? product.id;
  const imageRows = imageList(
    row.Images ?? row.images ?? row.ImageUrls ?? row.imageUrls ??
    row.ProductImages ?? row.productImages ??
    product.Images ?? product.images ?? product.ImageUrls ?? product.imageUrls ??
    product.ProductImages ?? product.productImages
  );
  const images = imageRows
    .map((image) => typeof image === "string"
      ? image
      : image?.ImagesPath ?? image?.imagesPath ?? image?.ImageUrl ?? image?.imageUrl ?? image?.Url ?? image?.url)
    .filter((image) => typeof image === "string" && image.trim());
  const image = row.Image ?? row.image ?? row.ImageUrl ?? row.imageUrl ?? row.imageurl ??
    product.Imageurl ?? product.ImageUrl ?? product.imageUrl ?? product.image ?? images[0] ?? "";
  if (image && !images.includes(image)) images.unshift(image);

  return {
    id: cartItemId ?? productId,
    cartItemId,
    productId,
    title: row.Title ?? row.title ?? row.ProductName ?? row.productName ??
      product.Title ?? product.title ?? product.ProductName ?? product.productName ?? "Product",
    category: row.Category ?? row.category ?? product.Category ?? product.category ?? "",
    image,
    images,
    price: Number(row.Price ?? row.price ?? product.Price ?? product.price ?? 0),
    quantity: Number(row.Quantity ?? row.quantity ?? 1),
  };
};

const cartService = {
  // ── READ ──────────────────────────────────────────────────────────────
  async getCart() {
    if (!isLoggedIn()) return localCart.get();

    try {
      const res = await api.get("/cart/GetCartbyuserid");
      const rows = res?.data?.data ?? res?.data?.Data ?? res?.data ?? res ?? [];
      return Array.isArray(rows) ? rows.map(mapApiItem) : [];
    } catch (err) {
      console.error("getCart failed:", err);
      throw err;
    }
  },

  /**
   * Returns only the cart line(s) for a single product. Used by the
   * "Buy Now" flow so checkout can be scoped to just that item without
   * touching the rest of the user's cart.
   */
  async getCartbyproduct(productId) {
    if (!productId) return [];

    if (!isLoggedIn()) {
      const cart = localCart.get();
      return cart.filter((item) => String(item.productId ?? item.id) === String(productId));
    }

    try {
      const res = await api.get(`/cart/GetCartbyproduct?productid=${productId}`);
      const rows = res?.data?.data ?? res?.data?.Data ?? res?.data ?? res ?? [];
      return Array.isArray(rows) ? rows.map(mapApiItem) : [rows].filter(Boolean).map(mapApiItem);
    } catch (err) {
      console.error("getCartbyproduct failed:", err);
      throw err;
    }
  },

  // ── ADD / INCREMENT ──────────────────────────────────────────────────
  async addToCart(product, quantity = 1) {
    if (!product) throw new Error("Product is required.");

    const productId = product.id ?? product.Id ?? product.productId ?? product.ProductId;
    const price = Number(product.price ?? product.Price ?? 0);
    const title =
      product.title ?? product.Title ?? product.productName ?? product.ProductName ?? "Product";

    if (!productId) throw new Error("Product ID is missing.");
    if (quantity <= 0) throw new Error("Quantity must be greater than zero.");

    if (!isLoggedIn()) {
      const cart = localCart.get();
      const existing = cart.find((item) => String(item.id) === String(productId));
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({
          id: productId,
          productId,
          title,
          price,
          image: product.imageurl ?? product.image ?? "",
          category: product.category ?? "",
          quantity,
        });
      }
      localCart.set(cart);
      notifyCartUpdated();
      return { success: true, message: "Product added to cart." };
    }

    try {
      const res = await api.post("/cart/Create", {
        ProductId: productId,
        Quantity: quantity,
        Price: price,
      });
      const body = res?.data !== undefined ? res : { success: true, data: res };
      if (body?.success === false) {
        throw new Error(body?.message || "Unable to add product to cart.");
      }
      notifyCartUpdated();
      return body;
    } catch (error) {
      console.error("addToCart failed:", error.response?.data || error.message);
      throw error;
    }
  },

  // ── UPDATE QUANTITY ──────────────────────────────────────────────────
  async updateQuantity(id, newQuantity, cartItemId) {
    const qty = Math.max(1, newQuantity);

    if (!isLoggedIn()) {
      const cart = localCart.get();
      const item = cart.find((x) => String(x.id) === String(id));
      if (item) {
        item.quantity = qty;
        localCart.set(cart);
        notifyCartUpdated();
      }
      return;
    }

    if (!cartItemId) {
      const error = new Error("The cart API did not return an item ID required to update quantity.");
      console.error("updateQuantity failed:", error);
      throw error;
    }

    try {
      await api.put(`/cart/Update/${cartItemId}`, { quantity: qty });
      notifyCartUpdated();
    } catch (err) {
      console.error("updateQuantity failed:", err);
      throw err;
    }
  },

  // ── REMOVE ───────────────────────────────────────────────────────────
  async removeCartItem(id, cartItemId) {
    if (!isLoggedIn()) {
      localCart.set(localCart.get().filter((x) => String(x.id) !== String(id)));
      notifyCartUpdated();
      return;
    }

    if (!cartItemId) {
      const error = new Error("The cart API did not return an item ID required to remove this item.");
      console.error("removeCartItem failed:", error);
      throw error;
    }

    try {
      await api.delete(`/cart/Delete/${cartItemId}`);
      notifyCartUpdated();
    } catch (err) {
      console.error("removeCartItem failed:", err);
      throw err;
    }
  },

  // ── CLEAR (after a successful order) ────────────────────────────────
  async clearCart() {
    if (!isLoggedIn()) {
      localCart.clear();
      return;
    }
    try {
      await api.delete("/cart/ClearCart");
    } catch (err) {
      console.error("clearCart failed:", err);
      throw err;
    }
  },

  // ── MERGE GUEST CART INTO SERVER CART (call right after login) ─────
  async mergeGuestCart() {
    const guestItems = localCart.get();
    if (!guestItems.length) return;

    try {
      await Promise.all(
        guestItems.map((item) =>
          api.post("/cart/Create", {
            ProductId: item.productId ?? item.id,
            Quantity: item.quantity,
            Price: item.price,
          })
        )
      );
      localCart.clear();
    } catch (err) {
      console.error("mergeGuestCart failed:", err);
    }
  },
};

export default cartService;

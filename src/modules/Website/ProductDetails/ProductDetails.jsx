// import React, { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import { FaStar, FaShoppingCart, FaBolt, FaHeart, FaArrowLeft } from "react-icons/fa";
// import productService from "../../../services/productService";
// import cartService from "../../../services/cartService";
// import { showSuccess } from "../../../shared/utils/alert";

// const ProductDetails = () => {
//   const { id } = useParams();
//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [qty, setQty] = useState(1);

//   useEffect(() => {
//     productService.getProduct(id)
//       .then(data => setProduct(data))
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, [id]);

//   const addToCart = () => {
//     for (let i = 0; i < qty; i++) 
//       cartService.addToCart(product);
//     //showSuccess("Added to Cart", `${qty}x ${product.data.ShortDescription?.slice(0, 30)}... added!`);
//   };

//   if (loading) return (
//     <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--text2)" }}>
//       Loading product.data...
//     </div>
//   );
//   if (!product) return (
//     <div style={{ textAlign: "center", padding: "80px", color: "var(--text2)" }}>
//       <h2>Product not found</h2>
//       <Link to="/products" style={{ color: "var(--accent)", marginTop: 16, display: "inline-block" }}>← Back to Products</Link>
//     </div>
//   );

//   const discount = Math.round(20 + Math.random() * 30);
//   const originalPrice = Math.round(product.data.price * (1 + discount / 100));

//   return (
//     <div style={{ padding: "40px 64px", maxWidth: 1280, margin: "0 auto" }}>
//       <Link to="/products" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text2)", fontSize: 14, marginBottom: 32 }}>
//         <FaArrowLeft /> Back to Products
//       </Link>

//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "start" }}>
//         {/* IMAGE */}
//         <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 48, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 440 }}>
//           <img src={product.data.imageurl} alt={product.data.ShortDescription} style={{ maxHeight: 380, maxWidth: "100%", objectFit: "contain" }} />
//         </div>

//         {/* INFO */}
//         <div>
//           {product.data.category && (
//             <div style={{ fontSize: 12, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600, marginBottom: 10 }}>{product.data.category}</div>
//           )}
//           <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>{product.data.title}</h1>

//           <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
//             <div style={{ display: "flex", gap: 3, color: "var(--gold)" }}>
//               {[...Array(5)].map((_, i) => <FaStar key={i} size={14} style={{ opacity: i < Math.round(product.data.rating?.rate || 4) ? 1 : 0.3 }} />)}
//             </div>
//             <span style={{ fontSize: 14, color: "var(--text2)" }}>{product.data.rating?.rate || "4.5"} ({product.data.rating?.count || "120"} reviews)</span>
//           </div>

//           <div style={{ marginBottom: 24 }}>
//             <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: "var(--text)" }}>₹{product.data.price}</span>
//             <span style={{ fontSize: 18, color: "var(--text2)", textDecoration: "line-through", marginLeft: 12 }}>₹{originalPrice}</span>
//             <span style={{ marginLeft: 10, background: "rgba(74,222,128,0.15)", color: "var(--success)", fontSize: 14, fontWeight: 700, padding: "3px 10px", borderRadius: 6 }}>{discount}% OFF</span>
//           </div>

//           <p style={{ color: "var(--text2)", lineHeight: 1.75, fontSize: 15, marginBottom: 28 }}>{product.data.longDescription}</p>

//           {/* QTY */}
//           <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
//             <span style={{ fontSize: 14, color: "var(--text2)", fontWeight: 500 }}>Quantity:</span>
//             <div style={{ display: "flex", alignItems: "center", gap: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
//               <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 40, background: "transparent", border: "none", color: "var(--text)", fontSize: 20, cursor: "pointer" }}>−</button>
//               <span style={{ padding: "0 16px", fontSize: 16, fontWeight: 600 }}>{qty}</span>
//               <button onClick={() => setQty(q => q + 1)} style={{ width: 40, height: 40, background: "transparent", border: "none", color: "var(--text)", fontSize: 20, cursor: "pointer" }}>+</button>
//             </div>
//           </div>

//           <div style={{ display: "flex", gap: 12 }}>
//             <button onClick={addToCart} style={{ flex: 1, padding: "14px 24px", background: "var(--surface)", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
//               <FaShoppingCart /> Add to Cart
//             </button>
//             <Link to="/checkout" style={{ flex: 1 }}>
//               <button onClick={addToCart} style={{ width: "100%", padding: "14px 24px", background: "var(--accent)", border: "none", color: "white", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
//                 <FaBolt /> Buy Now
//               </button>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductDetails;
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaStar,
  FaShoppingCart,
  FaBolt,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import productService from "../../../services/productService";
import cartService from "../../../services/cartService";
import QuoteRequestModal from "../Product/QuoteRequestModal";
import { showSuccess, showError } from "../../../shared/utils/alert";

function getProductImages(product) {
  const isImagePath = (value) =>
    typeof value === "string" &&
    value.trim() !== "" &&
    !/\/(?:product)?images\/?$/i.test(value.trim().replace(/[?#].*$/, "").replace(/\\/g, "/"));
  const storedImages =
    product.imageUrls ??
    product.ImageUrls ??
    product.Images ??
    product.images ??
    product.ProductImages ??
    product.productImages ??
    [];
  const images = Array.isArray(storedImages)
    ? storedImages
        .map((image) => typeof image === "string" ? image : image?.ImageUrl ?? image?.imageUrl ?? image?.ImagesPath ?? image?.imagesPath ?? image?.Url ?? image?.url)
        .filter(isImagePath)
    : [];
  const primaryImage =
    product.Imageurl ??
    product.ImageUrl ??
    product.imageUrl ??
    product.imageurl ??
    product.image;
  if (isImagePath(primaryImage) && !images.includes(primaryImage)) images.unshift(primaryImage);
  return [...new Set(images)];
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [qty, setQty] = useState(1);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      try {
        setLoading(true);

        const response = await productService.getProduct(id);

        if (isMounted) {
          setProduct(response?.data ?? response);
        }
      } catch (error) {
        console.error("Failed to load product:", error);

        if (isMounted) {
          setProduct(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadProduct();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = async (redirectToCheckout = false) => {
    if (!product) {
      showError("Error", "Product information is unavailable.");
      return;
    }

    if (!localStorage.getItem("accessToken")) {
      navigate(`/login?redirect=${encodeURIComponent(`/product/${id}`)}`);
      return;
    }

    try {
      setAdding(true);

      await cartService.addToCart(product, qty);

      showSuccess(
        "Added to Cart",
        `${qty} x ${product.shortDescription || product.ShortDescription || product.title || product.productName || product.ProductsName || product.ProductName || "Product"} added to cart.`
      );

      if (redirectToCheckout) {
        navigate(`/checkout?productId=${product.id ?? product.Id ?? id}`);
      }
    } catch (error) {
      console.error("Add to cart error:", error);

      showError(
        "Cart Error",
        error.response?.data?.message ||
          "Unable to add product to cart."
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          color: "var(--text2)"
        }}
      >
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px",
          color: "var(--text2)"
        }}
      >
        <h2>Product not found</h2>

        <Link
          to="/products"
          style={{
            color: "var(--accent)",
            marginTop: 16,
            display: "inline-block"
          }}
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const price = Number(product.price ?? product.Price ?? 0);

  const discount = 20;
  const originalPrice = Math.round(
    price * (1 + discount / 100)
  );

  const rating = product.rating?.rate ?? 4.5;
  const ratingCount = product.rating?.count ?? 120;
  const productImages = getProductImages(product);
  const activeImage = productImages.includes(selectedImage) ? selectedImage : productImages[0];
  const activeImageIndex = Math.max(0, productImages.indexOf(activeImage));
  const selectImage = (index) => {
    if (productImages.length) {
      setSelectedImage(productImages[(index + productImages.length) % productImages.length]);
    }
  };

  return (
    <div
      style={{
        padding: "40px 64px",
        maxWidth: 1280,
        margin: "0 auto"
      }}
    >
      <Link
        to="/products"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "var(--text2)",
          fontSize: 14,
          marginBottom: 32
        }}
      >
        <FaArrowLeft />
        Back to Products
      </Link>

      <div className="product-detail-layout">
        {/* PRODUCT IMAGE GALLERY */}
        <div>
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              padding: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 440
            }}
          >
            {activeImage ? (
              <div className="product-detail-gallery">
                <img
                  src={activeImage}
                  alt={product.shortDescription || product.ShortDescription || product.title || product.productName || product.ProductsName || product.ProductName || "Product"}
                  className="product-detail-main-image"
                />
                {productImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="product-detail-gallery-arrow product-detail-gallery-prev"
                      aria-label="Previous product image"
                      onClick={() => selectImage(activeImageIndex - 1)}
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      type="button"
                      className="product-detail-gallery-arrow product-detail-gallery-next"
                      aria-label="Next product image"
                      onClick={() => selectImage(activeImageIndex + 1)}
                    >
                      <FaChevronRight />
                    </button>
                    <span className="product-detail-image-count">
                      {activeImageIndex + 1} / {productImages.length}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <span style={{ color: "var(--text2)" }}>No product image available</span>
            )}
          </div>
          {productImages.length > 1 && (
            <div role="list" aria-label="Product images" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
              {productImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  role="listitem"
                  aria-label={`View product image ${index + 1}`}
                  aria-current={activeImage === image ? "true" : undefined}
                  onClick={() => selectImage(index)}
                  style={{ width: 76, height: 76, padding: 4, overflow: "hidden", background: "var(--surface)", border: `2px solid ${activeImage === image ? "var(--accent)" : "var(--border)"}`, borderRadius: 8, cursor: "pointer" }}
                >
                  <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT INFORMATION */}
        <div>
          {(product.category || product.Category) && (
            <div
              style={{
                fontSize: 12,
                color: "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                fontWeight: 600,
                marginBottom: 10
              }}
            >
              {product.category || product.Category}
            </div>
          )}

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: 16
            }}
          >
            {product.title || product.productName || product.Title || product.ProductsName || product.ProductName}
          </h1>

          {/* RATING */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 3,
                color: "var(--gold)"
              }}
            >
              {[...Array(5)].map((_, index) => (
                <FaStar
                  key={index}
                  size={14}
                  style={{
                    opacity: index < Math.round(rating) ? 1 : 0.3
                  }}
                />
              ))}
            </div>

            <span
              style={{
                fontSize: 14,
                color: "var(--text2)"
              }}
            >
              {rating} ({ratingCount} reviews)
            </span>
          </div>

          {/* PRICE */}
          <div style={{ marginBottom: 24 }}>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 40,
                fontWeight: 700,
                color: "var(--text)"
              }}
            >
              ₹{price}
            </span>

            <span
              style={{
                fontSize: 18,
                color: "var(--text2)",
                textDecoration: "line-through",
                marginLeft: 12
              }}
            >
              ₹{originalPrice}
            </span>

            <span
              style={{
                marginLeft: 10,
                background: "rgba(74,222,128,0.15)",
                color: "var(--success)",
                fontSize: 14,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 6
              }}
            >
              {discount}% OFF
            </span>
          </div>

          {/* DESCRIPTION */}
          <p
            style={{
              color: "var(--text2)",
              lineHeight: 1.75,
              fontSize: 15,
              marginBottom: 28
            }}
          >
            {product.longDescription ||
              product.LongDescription ||
              product.description ||
              product.shortDescription ||
              product.ShortDescription}
          </p>

          {/* QUANTITY */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 24
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: "var(--text2)",
                fontWeight: 500
              }}
            >
              Quantity:
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden"
              }}
            >
              <button
                type="button"
                disabled={adding}
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                style={quantityButtonStyle}
              >
                −
              </button>

              <span
                style={{
                  padding: "0 16px",
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                {qty}
              </span>

              <button
                type="button"
                disabled={adding}
                onClick={() => setQty((value) => value + 1)}
                style={quantityButtonStyle}
              >
                +
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              disabled={adding}
              onClick={() => handleAddToCart(false)}
              style={cartButtonStyle}
            >
              <FaShoppingCart />
              {adding ? "Adding..." : "Add to Cart"}
            </button>

            <button
              type="button"
              disabled={adding}
              onClick={() => handleAddToCart(true)}
              style={buyButtonStyle}
            >
              <FaBolt />
              {adding ? "Processing..." : "Buy Now"}
            </button>
          </div>
          <button
            type="button"
            className="product-quote-trigger"
            onClick={() => setQuoteOpen(true)}
          >
            Get a Quote
          </button>
        </div>
      </div>
      {quoteOpen && <QuoteRequestModal product={product} onClose={() => setQuoteOpen(false)} />}
    </div>
  );
};

const quantityButtonStyle = {
  width: 40,
  height: 40,
  background: "transparent",
  border: "none",
  color: "var(--text)",
  fontSize: 20,
  cursor: "pointer"
};

const cartButtonStyle = {
  flex: 1,
  padding: "14px 24px",
  background: "var(--surface)",
  border: "1px solid var(--accent)",
  color: "var(--accent)",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8
};

const buyButtonStyle = {
  flex: 1,
  padding: "14px 24px",
  background: "var(--accent)",
  border: "none",
  color: "white",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8
};

export default ProductDetails;
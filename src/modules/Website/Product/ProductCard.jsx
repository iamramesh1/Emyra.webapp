import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHeart, FaStar, FaShoppingCart, FaBolt, FaEye, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import cartService from "../../../services/cartService";
import { showError, showSuccess } from "../../../shared/utils/alert";
import QuoteRequestModal from "./QuoteRequestModal";

const ProductCard = ({ product }) => {
  const [wished, setWished] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const productId = product.id ?? product.Id ?? product.productId ?? product.ProductId;
  const title = product.title || product.productName || product.Title || product.ProductsName || product.ProductName || "Product";
  const category = product.category || product.Category || "General";
  const image = product.image || product.imageurl || product.Imageurl || product.imageUrl || product.ImageUrl;
  const images = [...new Set([
    ...(Array.isArray(product.imageUrls) ? product.imageUrls : []),
    ...(Array.isArray(product.ImageUrls) ? product.ImageUrls : []),
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.Images) ? product.Images : []),
    image,
  ].map((item) => typeof item === "string" ? item : item?.imageUrl ?? item?.ImageUrl ?? item?.ImagesPath ?? item?.imagesPath ?? item?.url ?? item?.Url).filter(Boolean))];
  const activeImage = images.length ? images[imageIndex % images.length] : "";

  const addToCart = async (e, buyNow = false) => {
    e.preventDefault();
    if (!localStorage.getItem("accessToken")) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    try {
      await cartService.addToCart(product);
      if (buyNow) {
        navigate(`/checkout?productId=${productId}`);
      } else {
        showSuccess("Added to Cart", `${title.slice(0, 30)}... added!`);
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      showError("Cart Error", error.response?.data?.message || "Unable to add product to cart.");
    }
  };

  const toggleWish = (e) => {
    e.preventDefault();
    setWished(!wished);
  };

  return (
    <div className="product-card">
      <div className="product-image-wrap">
        {category !== "General" && (
          <span className="product-badge">{category}</span>
        )}
        <button
          className={`wishlist-btn ${wished ? "active" : ""}`}
          onClick={toggleWish}
        >
          <FaHeart />
        </button>
        {activeImage && <img src={activeImage} alt={title} />}
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="product-gallery-arrow product-gallery-prev"
              aria-label={`Previous ${title} image`}
              onClick={() => setImageIndex((index) => (index - 1 + images.length) % images.length)}
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              className="product-gallery-arrow product-gallery-next"
              aria-label={`Next ${title} image`}
              onClick={() => setImageIndex((index) => (index + 1) % images.length)}
            >
              <FaChevronRight />
            </button>
            <div className="product-gallery-dots" aria-label="Select product image">
              {images.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  type="button"
                  aria-label={`Show ${title} image ${index + 1}`}
                  aria-current={index === imageIndex ? "true" : undefined}
                  onClick={() => setImageIndex(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="product-info">
        <div className="product-category">{category}</div>
        <div className="product-title">{title}</div>
        <div className="product-price-row">
          <div>
            <span className="price">₹{product.price ?? product.Price}</span>
            <span className="price-old">₹{Math.round((product.price ?? product.Price ?? 0) * 1.3)}</span>
          </div>
          <div className="rating">
            <FaStar />
            <span>{product.rating?.rate || "4.5"}</span>
          </div>
        </div>
        <div className="product-actions">
          <button className="cart-btn" onClick={(event) => addToCart(event)}>
            <FaShoppingCart style={{ marginRight: 6 }} />Add to Cart
          </button>
          <button className="buy-btn" onClick={(event) => addToCart(event, true)}>
            <FaBolt style={{ marginRight: 6 }} />Buy Now
          </button>
          <button className="quote-btn" onClick={() => setQuoteOpen(true)}>
            Get Quote
          </button>
          <Link to={`/product/${productId}`} className="view-btn">
            <FaEye style={{ marginRight: 6 }} />Details
          </Link>
        </div>
      </div>
      {quoteOpen && <QuoteRequestModal product={product} onClose={() => setQuoteOpen(false)} />}
    </div>
  );
};

export default ProductCard;

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaFileAlt, FaPhoneAlt, FaTimes } from "react-icons/fa";
import publicApiClient from "../../../services/publicapiClient";

const QuoteRequestModal = ({ product, onClose }) => {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitRequest = async (event) => {
    event.preventDefault();
    const phone = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    const title = product.title || product.productName || product.Title || "Product";
    const description =
      product.longDescription ||
      product.description ||
      product.shortDescription ||
      product.Description ||
      "Product details are available on request.";

    setLoading(true);
    setError("");
    try {
      const response = await publicApiClient.post("/B2BOrderEnquiry/Create", {
        companyName: `Product quote request - ${title}`,
        contactPerson: "Website visitor",
        email: "",
        phone,
        category: product.category || product.Category || title,
        quantity: "1",
        city: "",
        gstin: "",
        message: `Product: ${title}\nDescription: ${description}`,
      });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Unable to submit your quote request.");
      }
      setSubmitted(true);
    } catch (requestError) {
      console.error("Quote request error:", requestError);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to submit your quote request. Please call 8285019736."
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="quote-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <section
        className="quote-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-modal-title"
      >
        <button
          type="button"
          className="quote-modal-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Close quote form"
        >
          <FaTimes />
        </button>
        {submitted ? (
          <div className="quote-success">
            <span className="quote-modal-icon"><FaPhoneAlt /></span>
            <h2 id="quote-modal-title">Quote request received</h2>
            <p>We will contact you about this product at {mobile}.</p>
            <button type="button" className="quote-submit" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <span className="quote-modal-icon"><FaFileAlt /></span>
            <p className="quote-eyebrow">PRODUCT ENQUIRY</p>
            <h2 id="quote-modal-title">Get a quote</h2>
            <h3>{product.title || product.productName || product.Title}</h3>
            <p className="quote-product-description">
              {product.longDescription ||
                product.description ||
                product.shortDescription ||
                product.Description ||
                "Contact us for complete product details."}
            </p>
            <form onSubmit={submitRequest}>
              <label htmlFor="quote-mobile">Mobile number</label>
              <input
                id="quote-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(event) => {
                  setMobile(event.target.value.replace(/\D/g, "").slice(0, 10));
                  setError("");
                }}
                required
              />
              {error && <p className="quote-error" role="alert">{error}</p>}
              <button type="submit" className="quote-submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit enquiry"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>,
    document.body
  );
};

export default QuoteRequestModal;

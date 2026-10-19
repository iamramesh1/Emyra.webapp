import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./home.css";
import publicApiClient from "../../../services/publicapiClient";
import productService, { getProductCategories } from "../../../services/productService";
import ProductCard from "../Product/ProductCard";
const PERKS = [
  { icon: "01", bg: "#e8f1ef", color: "#08756d", title: "Manufacturer & wholesaler", desc: "A focused range of appliance protection products." },
  { icon: "02", bg: "#f6efdf", color: "#987334", title: "Home and trade use", desc: "Browse practical covers for everyday appliances." },
  { icon: "03", bg: "#e9eef1", color: "#3c5d67", title: "Bulk enquiries welcome", desc: "Share your product and quantity requirements." },
];

// ─── B2B Form Component ──────────────────────────────────────────────────────
const B2BForm = () => {
  const [productCategories, setProductCategories] = useState([]);
  const [form, setForm] = useState({
    companyName: "", contactPerson: "", email: "", phone: "",
    category: "", quantity: "", city: "", gstin: "", message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const required = ["companyName", "contactPerson", "email", "phone", "category", "quantity"];

  useEffect(() => {
    let active = true;
    productService.getProducts()
      .then((products) => {
        if (active) setProductCategories(getProductCategories(products));
      })
      .catch((error) => {
        console.error("Failed to load wholesale enquiry categories:", error);
      });
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: false }));
  };

  const validate = () => {
    const newErr = {};
    required.forEach((k) => { if (!form[k].trim()) newErr[k] = true; });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErr.email = true;
    if (form.phone && !/^[\d\s+\-()]{7,}$/.test(form.phone)) newErr.phone = true;
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError("");
    try {
      const response = await publicApiClient.post("/B2BOrderEnquiry/Create", form);
      if (response.data?.success === false) {
        throw new Error(response.data.message || "Unable to submit your enquiry.");
      }
      setSubmitted(true);
    } catch (error) {
      console.error("Wholesale enquiry error:", error);
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Unable to submit your enquiry. Please call 8285019736."
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({ companyName: "", contactPerson: "", email: "", phone: "", category: "", quantity: "", city: "", gstin: "", message: "" });
    setErrors({});
    setSubmitError("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="b2b-form-card">
        <div className="b2b-success">
          <div className="b2b-success-icon">✅</div>
          <h3>Enquiry Received!</h3>
          <p>Our B2B team will contact <strong>{form.contactPerson || "you"}</strong> at <strong>{form.email}</strong> within 24 hours.</p>
          <button className="b2b-reset-btn" onClick={reset}>Submit Another Enquiry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="b2b-form-card">
      <h3 className="b2b-form-title">Request a wholesale quote</h3>
      <p className="b2b-form-sub">Share the products and quantities you are sourcing.</p>

      <form className="b2b-form" onSubmit={handleSubmit} noValidate>
        <div className="b2b-row">
          <div className={`b2b-field${errors.companyName ? " err" : ""}`}>
            <label>Company Name *</label>
            <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. Sharma Enterprises" />
            {errors.companyName && <span className="err-msg">Required</span>}
          </div>
          <div className={`b2b-field${errors.contactPerson ? " err" : ""}`}>
            <label>Contact Person *</label>
            <input name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="Your full name" />
            {errors.contactPerson && <span className="err-msg">Required</span>}
          </div>
        </div>

        <div className="b2b-row">
          <div className={`b2b-field${errors.email ? " err" : ""}`}>
            <label>Business Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@company.com" />
            {errors.email && <span className="err-msg">Valid email required</span>}
          </div>
          <div className={`b2b-field${errors.phone ? " err" : ""}`}>
            <label>Phone Number *</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
            {errors.phone && <span className="err-msg">Valid phone required</span>}
          </div>
        </div>

        <div className="b2b-row">
          <div className={`b2b-field${errors.category ? " err" : ""}`}>
            <label>Product Category *</label>
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="">Select category</option>
              {productCategories.map((category) => <option key={category}>{category}</option>)}
              <option>Multiple Categories</option>
            </select>
            {errors.category && <span className="err-msg">Required</span>}
          </div>
          <div className={`b2b-field${errors.quantity ? " err" : ""}`}>
            <label>Approx. Quantity *</label>
            <select name="quantity" value={form.quantity} onChange={handleChange}>
              <option value="">Select range</option>
              <option>50 – 200 units</option>
              <option>200 – 500 units</option>
              <option>500 – 1000 units</option>
              <option>1000+ units</option>
            </select>
            {errors.quantity && <span className="err-msg">Required</span>}
          </div>
        </div>

        <div className="b2b-row">
          <div className="b2b-field">
            <label>City / State</label>
            <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Mumbai, Maharashtra" />
          </div>
          <div className="b2b-field">
            <label>GSTIN (optional)</label>
            <input name="gstin" value={form.gstin} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
          </div>
        </div>

        <div className="b2b-field full">
          <label>Additional Requirements</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={3}
            placeholder="Custom branding, specific sizes, delivery timeline, GST billing details, etc."
          />
        </div>

        {submitError && <p className="b2b-submit-error" role="alert">{submitError}</p>}
        <button type="submit" className="b2b-submit" disabled={loading}>
          {loading ? "Sending..." : "Send Enquiry"}
        </button>
      </form>
    </div>
  );
};

const HomeProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    productService.getProducts()
      .then((items) => {
        if (isMounted) setProducts(Array.isArray(items) ? items : []);
      })
      .catch((requestError) => {
        console.error("Failed to load home page products:", requestError);
        if (isMounted) setError("Unable to load products right now.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="home-products" id="products">
      <div className="fiva-section-heading">
        <div>
          <p className="fiva-eyebrow">SHOP THE RANGE</p>
          <h2>Browse products</h2>
          <p>Explore the full product range. Sign in only when you choose to buy or add an item to your cart.</p>
        </div>
        <Link to="/products" className="fiva-text-link">
          View catalogue <span aria-hidden="true">→</span>
        </Link>
      </div>
      {loading ? (
        <p className="home-products-state" role="status">Loading products…</p>
      ) : error ? (
        <p className="home-products-state" role="alert">{error}</p>
      ) : products.length === 0 ? (
        <p className="home-products-state">No products are available right now.</p>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product, index) => (
              <ProductCard
                key={product.id ?? product.Id ?? product.productId ?? index}
                product={product}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

// ─── Main Home Component ─────────────────────────────────────────────────────
const Home = () => (
  <div className="fiva-home">
    <section className="fiva-hero">
      <div className="fiva-hero-copy">
        <p className="fiva-eyebrow">FIVA · APPLIANCE PROTECTION</p>
        <h1>Appliance covers for everyday living.</h1>
        <p className="fiva-hero-intro">
          Thoughtful protection for air conditioners, washing machines and the
          appliances that make a home work.
        </p>
        <div className="fiva-hero-actions">
          <a className="fiva-button fiva-button-primary" href="#collections">Browse collections</a>
          <a className="fiva-button fiva-button-secondary" href="#wholesale">Wholesale enquiry</a>
        </div>
        <div className="fiva-hero-note">
          <span>Manufacturer & wholesaler</span>
          <span>Based in New Delhi, India</span>
        </div>
      </div>
      <div className="fiva-hero-media">
        <img
          src="https://5.imimg.com/data5/SELLER/Default/2025/12/571516490/JO/PV/CQ/52162515/71mgbqwitzl-250x250.jpg"
          alt="Printed cover protecting an indoor and outdoor air conditioner"
          fetchPriority="high"
        />
        <p className="fiva-image-caption">Protection that fits into your home</p>
      </div>
    </section>

    <section className="fiva-collections" id="collections">
      <div className="fiva-section-heading">
        <div>
          <p className="fiva-eyebrow">EXPLORE THE RANGE</p>
          <h2>Made for the appliances you use most</h2>
        </div>
        <Link to="/products" className="fiva-text-link">View all products <span aria-hidden="true">→</span></Link>
      </div>
    </section>

    <HomeProducts />

    <section className="b2b-section fiva-enquiry" id="wholesale">
      <div className="b2b-grid">
        <div className="b2b-info">
          <p className="b2b-info-label">FOR YOUR BUSINESS</p>
          <h2 className="b2b-info-title">A dependable cover range for your customers.</h2>
          <p className="b2b-info-desc">
            AK Trader Center is a manufacturer and wholesaler of appliance
            covers. Tell us which products and quantities you are looking for.
          </p>
          <div className="b2b-perks">
            {PERKS.map((perk) => (
              <div className="b2b-perk" key={perk.title}>
                <div className="b2b-perk-icon" style={{ background: perk.bg, color: perk.color }}>
                  <span>{perk.icon}</span>
                </div>
                <div>
                  <h4 className="b2b-perk-title">{perk.title}</h4>
                  <p className="b2b-perk-desc">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {/* <p className="fiva-location-note">
            AK Trader Center · Imran Ahamad (Proprietor)<br />
            1st Floor, 627, Kabir Basti, Malka Ganj, Near Community Centre,
            New Delhi - 110007, Delhi, India<br />
            <a href="tel:8285019736" style={{ color: "inherit" }}>8285019736</a>
            {" · "}
            <a href="mailto:rks26061992@gmail.com" style={{ color: "inherit" }}>rks26061992@gmail.com</a>
            {" · GST No.: 07CDOPA4503R1Z8"}
          </p> */}
        </div>
        <B2BForm />
      </div>
    </section>
  </div>
);

export default Home;
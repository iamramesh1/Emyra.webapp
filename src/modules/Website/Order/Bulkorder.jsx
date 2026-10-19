import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import b2bService from "../b2b/b2bService";
import { showSuccess, showError } from "../../../shared/utils/alert";
import "../b2b/b2b.css";

const emptyForm = {
  companyName: "",
  contactPerson: "",
  businessEmail: "",
  phoneNumber: "",
  gstin: "",
  city: "",
  state: "",
  productCategory: "",
  approxQuantity: "",
  additionalRequirements: "",
};

/**
 * Customer-facing "Submit a Bulk / B2B Enquiry" form.
 * On success the enquiry shows up in /my-bulk-orders where the
 * customer can track it through quotation → order → shipment.
 */
const Bulkorder = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await b2bService.createEnquiry(form);
      await showSuccess("Enquiry Submitted", "Our team will review it and send you a quotation shortly.");
      navigate("/my-bulk-orders");
    } catch (err) {
      console.error("createEnquiry failed:", err);
      const message = err?.response?.data?.message || "Couldn't submit your enquiry. Please try again.";
      setError(message);
      showError("Submission Failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "40px 64px", maxWidth: 760, margin: "0 auto" }}>
      <Link
        to="/my-bulk-orders"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text2)", fontSize: 14, marginBottom: 24 }}
      >
        <FaArrowLeft /> My Bulk Orders
      </Link>

      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, marginBottom: 8 }}>
        Submit a Bulk / B2B Enquiry
      </h1>
      <p style={{ color: "var(--text2)", marginBottom: 28, fontSize: 14 }}>
        Tell us what your business needs and our team will get back to you with a custom quotation.
      </p>

      {error && (
        <div style={{ background: "rgba(255,68,85,0.1)", border: "1px solid #ff4455", color: "#ff4455", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
      >
        <div style={{ gridColumn: "1 / -1", fontSize: 13, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Company Details
        </div>

        <input name="companyName" placeholder="Company Name *" value={form.companyName} onChange={handleChange} required style={inputStyle} />
        <input name="gstin" placeholder="GSTIN (optional)" value={form.gstin} onChange={handleChange} style={inputStyle} />
        <input name="contactPerson" placeholder="Contact Person *" value={form.contactPerson} onChange={handleChange} required style={inputStyle} />
        <input name="phoneNumber" type="tel" placeholder="Phone Number *" value={form.phoneNumber} onChange={handleChange} required style={inputStyle} />
        <input name="businessEmail" type="email" placeholder="Business Email *" value={form.businessEmail} onChange={handleChange} required style={{ ...inputStyle, gridColumn: "1 / -1" }} />
        <input name="city" placeholder="City *" value={form.city} onChange={handleChange} required style={inputStyle} />
        <input name="state" placeholder="State *" value={form.state} onChange={handleChange} required style={inputStyle} />

        <div style={{ gridColumn: "1 / -1", fontSize: 13, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 8 }}>
          Order Requirement
        </div>

        <input name="productCategory" placeholder="Product Category *" value={form.productCategory} onChange={handleChange} required style={inputStyle} />
        <input name="approxQuantity" type="number" min="1" placeholder="Approx. Quantity *" value={form.approxQuantity} onChange={handleChange} required style={inputStyle} />
        <textarea
          name="additionalRequirements"
          placeholder="Additional requirements, specifications, delivery timelines, etc."
          value={form.additionalRequirements}
          onChange={handleChange}
          rows={4}
          style={{ ...inputStyle, gridColumn: "1 / -1", resize: "vertical", fontFamily: "inherit" }}
        />

        <button
          type="submit"
          disabled={submitting}
          style={{
            gridColumn: "1 / -1",
            marginTop: 8,
            padding: "14px",
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 700,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          <FaPaperPlane /> {submitting ? "Submitting…" : "Submit Enquiry"}
        </button>
      </form>
    </div>
  );
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface2)",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
};

export default Bulkorder;

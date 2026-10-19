import React, { useState, useEffect } from "react";
import { FaAmazon, FaRobot, FaCheck, FaSpinner, FaCloudUploadAlt, FaEye } from "react-icons/fa";
import productService from "../../../services/productService";

// ─── SERVICE: Amazon SP-API Push ──────────────────────────────────────────
const amazonService = {
  async enrichWithLLM(product) {
    // Step 1: Call LLM to enrich product before Amazon push
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are an Amazon listing optimization expert. Given this product, generate an Amazon-optimized listing.
Product: ${JSON.stringify({ title: product.title, price: product.price, category: product.category, description: product.description })}

Respond ONLY in JSON with NO markdown/backticks:
{
  "amazon_title": "SEO-optimized Amazon title (max 200 chars)",
  "bullet_points": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "description": "Enhanced Amazon product description (200-300 words)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "suggested_category": "Amazon browse node category",
  "price_recommendation": "suggested price in USD"
}`
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.map(i => i.text || "").join("") || "{}";
    try {
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return { amazon_title: product.title, bullet_points: [], description: product.description, keywords: [] };
    }
  },

  async pushToAmazon(enrichedProduct) {
    // Step 2: Push to Amazon SP-API (simulated — replace with real SP-API endpoint)
    // Real endpoint: https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items/{sellerId}/{sku}
    await new Promise(r => setTimeout(r, 800));
    return {
      sku: `NX-${enrichedProduct.id}-${Date.now()}`,
      asin: `B0${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: "ACCEPTED",
      submission_id: `SUB${Date.now()}`
    };
  }
};

// ─── STATUS BADGE ──────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const colors = {
    idle: { bg: "rgba(153,150,160,0.15)", color: "var(--text2)", label: "Ready" },
    enriching: { bg: "rgba(245,200,66,0.15)", color: "var(--gold)", label: "AI Enriching..." },
    pushing: { bg: "rgba(96,165,250,0.15)", color: "#60a5fa", label: "Pushing to Amazon" },
    done: { bg: "rgba(74,222,128,0.15)", color: "var(--success)", label: "Published" },
    error: { bg: "rgba(255,68,85,0.15)", color: "#ff4455", label: "Error" },
  };
  const s = colors[status] || colors.idle;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 50, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
      {status === "enriching" || status === "pushing" ? <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> : null}
      {s.label}
    </span>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
const AmazonPush = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState({});
  const [results, setResults] = useState({});
  const [preview, setPreview] = useState(null);
  const [enriched, setEnriched] = useState({});

  useEffect(() => {
    productService.getProducts()
      .then(data => setProducts(Array.isArray(data) ? data.slice(0, 12) : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = (id, s) => setStatuses(p => ({ ...p, [id]: s }));

  const pushProduct = async (product) => {
    try {
      // ── STEP 1: Enrich with LLM ──
      setStatus(product.id, "enriching");
      const llmData = await amazonService.enrichWithLLM(product);
      setEnriched(p => ({ ...p, [product.id]: llmData }));

      // ── STEP 2: Push to Amazon ──
      setStatus(product.id, "pushing");
      const amazonResult = await amazonService.pushToAmazon({ ...product, ...llmData });
      setResults(p => ({ ...p, [product.id]: amazonResult }));
      setStatus(product.id, "done");
    } catch (err) {
      console.error(err);
      setStatus(product.id, "error");
    }
  };

  const pushAll = async () => {
    const unpushed = products.filter(p => !statuses[p.id] || statuses[p.id] === "idle");
    for (const product of unpushed) {
      await pushProduct(product);
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const doneCount = Object.values(statuses).filter(s => s === "done").length;
  const inProgress = Object.values(statuses).some(s => s === "enriching" || s === "pushing");

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", color: "var(--text2)" }}>
      Loading products...
    </div>
  );

  return (
    <div style={{ padding: "32px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ff9900", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaAmazon size={24} style={{ color: "#0a0a0f" }} />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, lineHeight: 1 }}>Amazon Product Publisher</h1>
              <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>AI enriches listings before pushing to Amazon SP-API</p>
            </div>
          </div>

          {/* FLOW */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 20px", gap: 12, flexWrap: "wrap" }}>
            {[
              { icon: "📦", label: "Select Products", color: "var(--text)" },
              { icon: "→", label: null, color: "var(--text2)" },
              { icon: "🤖", label: "LLM Enrichment", color: "var(--gold)" },
              { icon: "→", label: null, color: "var(--text2)" },
              { icon: "🚀", label: "Amazon SP-API Push", color: "#ff9900" },
              { icon: "→", label: null, color: "var(--text2)" },
              { icon: "✅", label: "Published & Live", color: "var(--success)" },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: step.label ? 16 : 14, color: step.color }}>{step.icon}</span>
                {step.label && <span style={{ fontSize: 13, fontWeight: 600, color: step.color }}>{step.label}</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ textAlign: "right", marginRight: 8 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "var(--success)" }}>{doneCount}</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>Published</div>
          </div>
          <button
            onClick={pushAll}
            disabled={inProgress}
            style={{ padding: "12px 24px", background: inProgress ? "var(--surface2)" : "#ff9900", color: inProgress ? "var(--text2)" : "#0a0a0f", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: inProgress ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
          >
            <FaCloudUploadAlt />
            {inProgress ? "Publishing..." : "Push All to Amazon"}
          </button>
        </div>
      </div>

      {/* PRODUCT TABLE */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 120px 140px 120px", gap: 0, padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--text2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>
          <span></span><span>Product</span><span>Price</span><span>Category</span><span>Status</span><span>Actions</span>
        </div>

        {products.map((product, idx) => {
          const status = statuses[product.id] || "idle";
          const result = results[product.id];
          const enrichedData = enriched[product.id];

          return (
            <div key={product.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 120px 140px 120px", gap: 0, padding: "16px 20px", borderBottom: idx < products.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", background: status === "done" ? "rgba(74,222,128,0.03)" : "transparent", transition: "background 0.3s" }}>
              {/* IMG */}
              <img src={product.image} alt="" style={{ width: 44, height: 44, objectFit: "contain", background: "var(--surface2)", borderRadius: 6, padding: 4 }} />

              {/* PRODUCT INFO */}
              <div style={{ paddingRight: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>{product.title?.slice(0, 60)}...</div>
                {result && (
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>
                    ASIN: <span style={{ color: "#ff9900", fontWeight: 600 }}>{result.asin}</span>
                    <span style={{ margin: "0 8px" }}>·</span>
                    SKU: <span style={{ fontWeight: 600 }}>{result.sku}</span>
                  </div>
                )}
              </div>

              {/* PRICE */}
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700 }}>₹{product.price}</div>

              {/* CATEGORY */}
              <div style={{ fontSize: 12, color: "var(--text2)", textTransform: "capitalize" }}>{product.category || "—"}</div>

              {/* STATUS */}
              <div><StatusBadge status={status} /></div>

              {/* ACTIONS */}
              <div style={{ display: "flex", gap: 8 }}>
                {status === "idle" || status === "error" ? (
                  <button
                    onClick={() => pushProduct(product)}
                    style={{ padding: "7px 14px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = "#ff9900"; e.currentTarget.style.color = "#ff9900"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
                  >
                    <FaAmazon size={11} /> Push
                  </button>
                ) : null}
                {enrichedData && (
                  <button
                    onClick={() => setPreview({ product, enrichedData, result })}
                    style={{ padding: "7px 10px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)", borderRadius: 7, fontSize: 12, cursor: "pointer" }}
                  >
                    <FaEye />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LLM PREVIEW MODAL */}
      {preview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setPreview(null)}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, maxWidth: 640, width: "100%", maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <FaRobot size={20} style={{ color: "var(--gold)" }} />
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>AI-Enriched Listing</h3>
              <button onClick={() => setPreview(null)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "var(--text2)", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Amazon Title</div>
                <div style={{ fontSize: 15, lineHeight: 1.5, background: "var(--surface2)", borderRadius: 8, padding: "12px 14px" }}>{preview.enrichedData.amazon_title || preview.product.title}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Bullet Points</div>
                <ul style={{ background: "var(--surface2)", borderRadius: 8, padding: "12px 14px 12px 28px", margin: 0 }}>
                  {(preview.enrichedData.bullet_points || []).map((bp, i) => (
                    <li key={i} style={{ fontSize: 14, color: "var(--text)", marginBottom: 6, lineHeight: 1.5 }}>{bp}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Enhanced Description</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, background: "var(--surface2)", borderRadius: 8, padding: "12px 14px", color: "var(--text2)" }}>{preview.enrichedData.description}</div>
              </div>

              {preview.enrichedData.keywords?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>SEO Keywords</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {preview.enrichedData.keywords.map((kw, i) => (
                      <span key={i} style={{ padding: "4px 12px", background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)", color: "var(--accent)", borderRadius: 50, fontSize: 12 }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {preview.result && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "ASIN", value: preview.result.asin, color: "#ff9900" },
                    { label: "SKU", value: preview.result.sku, color: "var(--text)" },
                    { label: "Status", value: preview.result.status, color: "var(--success)" },
                    { label: "Submission ID", value: preview.result.submission_id, color: "var(--text2)" },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>{row.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: row.color }}>{row.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmazonPush;

// import React, { useState, useEffect, useCallback, useRef } from "react";
// import {
//   FaPlus,
//   FaEdit,
//   FaTrash,
//   FaAmazon,
//   FaSearch,
//   FaTimes,
//   FaChevronLeft,
//   FaChevronRight,
//   FaBoxOpen,
//   FaFilter,
//   FaSpinner,
//   FaCheckCircle,
//   FaExclamationCircle,
// } from "react-icons/fa";

// // ==========================================
// // CONFIG
// // ==========================================

// import env from "../../../config/env";

// const API_BASE = `${env.DIGITAL_API_URL}/Product`; // matches ProductController route

// const CATEGORY_OPTIONS = [
//   "Apparel",
//   "Footwear",
//   "Accessories",
//   "Home & Living",
//   "Electronics",
//   "Beauty",
//   "Other",
// ];

// const STATUS_OPTIONS = ["Active", "Inactive", "Draft", "OutOfStock"];

// const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// const EMPTY_FORM = {
//   id: null,
//   sku: "",
//   productName: "",
//   brand: "",
//   category: "",
//   subCategory: "",
//   shortDescription: "",
//   longDescription: "",
//   price: "",
//   mrp: "",
//   stock: "",
//   weight: "",
//   dimensions: "",
//   material: "",
//   color: "",
//   size: "",
//   countryOfOrigin: "",
//   manufacturer: "",
//   tags: "",
//   imageUrl: "",
//   isActive: true,
//   status: "Active",
// };

// // ==========================================
// // SMALL HELPERS
// // ==========================================

// function currency(value) {
//   const n = Number(value);
//   if (Number.isNaN(n)) return "-";
//   return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
// }

// function useDebouncedValue(value, delay = 400) {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const t = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(t);
//   }, [value, delay]);
//   return debounced;
// }

// // Maps a Products row coming back from the API (PascalCase, matching the
// // SQL table / C# model) into the camelCase shape the form + table use.
// function mapProductFromApi(p) {
//   return {
//     id: p.Id ?? p.id,
//     sku: p.SKU ?? p.sku ?? "",
//     productName: p.ProductName ?? p.productName ?? "",
//     brand: p.Brand ?? p.brand ?? "",
//     category: p.Category ?? p.category ?? "",
//     subCategory: p.SubCategory ?? p.subCategory ?? "",
//     shortDescription: p.ShortDescription ?? p.shortDescription ?? "",
//     longDescription: p.LongDescription ?? p.longDescription ?? "",
//     price: p.Price ?? p.price ?? 0,
//     mrp: p.MRP ?? p.mrp ?? 0,
//     stock: p.Stock ?? p.stock ?? 0,
//     weight: p.Weight ?? p.weight ?? "",
//     dimensions: p.Dimensions ?? p.dimensions ?? "",
//     material: p.Material ?? p.material ?? "",
//     color: p.Color ?? p.color ?? "",
//     size: p.Size ?? p.size ?? "",
//     countryOfOrigin: p.CountryOfOrigin ?? p.countryOfOrigin ?? "",
//     manufacturer: p.Manufacturer ?? p.manufacturer ?? "",
//     tags: p.Tags ?? p.tags ?? "",
//     imageUrl: p.Imageurl ?? p.imageUrl ?? "",
//     isActive: p.IsActive ?? p.isActive ?? true,
//     isDeleted: p.IsDeleted ?? p.isDeleted ?? false,
//     status: p.Status ?? p.status ?? "Active",
//     amazonPushed: p.AmazonPushed ?? p.amazonPushed ?? false,
//   };
// }

// // Maps the camelCase form state back to the PascalCase payload the API
// // (backed by the Products / BaseModel classes) expects.
// function mapProductToApi(f) {
//   return {
//     Id: f.id || undefined,
//     SKU: f.sku,
//     ProductName: f.productName,
//     Brand: f.brand,
//     Category: f.category,
//     SubCategory: f.subCategory,
//     ShortDescription: f.shortDescription,
//     LongDescription: f.longDescription,
//     Price: Number(f.price) || 0,
//     MRP: Number(f.mrp) || 0,
//     Stock: parseInt(f.stock, 10) || 0,
//     Weight: Number(f.weight) || 0,
//     Dimensions: f.dimensions,
//     Material: f.material,
//     Color: f.color,
//     Size: f.size,
//     CountryOfOrigin: f.countryOfOrigin,
//     Manufacturer: f.manufacturer,
//     Tags: f.tags,
//     Imageurl: f.imageUrl,
//     IsActive: f.isActive,
//     Status: f.status,
//   };
// }

// // ==========================================
// // TOAST
// // ==========================================

// function Toast({ toast, onClose }) {
//   useEffect(() => {
//     if (!toast) return;
//     const t = setTimeout(onClose, 3500);
//     return () => clearTimeout(t);
//   }, [toast, onClose]);

//   if (!toast) return null;

//   const isError = toast.type === "error";

//   return (
//     <div
//       style={{
//         position: "fixed",
//         bottom: 28,
//         right: 28,
//         zIndex: 1000,
//         display: "flex",
//         alignItems: "center",
//         gap: 10,
//         padding: "14px 18px",
//         borderRadius: "var(--radius)",
//         background: isError ? "#3b1414" : "#0f2e1f",
//         border: `1px solid ${isError ? "#b91c1c" : "var(--success)"}`,
//         color: "#fff",
//         minWidth: 260,
//         boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
//       }}
//     >
//       {isError ? (
//         <FaExclamationCircle color="#f87171" />
//       ) : (
//         <FaCheckCircle color="var(--success)" />
//       )}
//       <span style={{ fontSize: 14 }}>{toast.message}</span>
//     </div>
//   );
// }

// // ==========================================
// // PRODUCT FORM (Add / Edit) MODAL
// // ==========================================

// function ProductFormModal({ open, initial, onClose, onSave, saving }) {
//   const [form, setForm] = useState(EMPTY_FORM);

//   useEffect(() => {
//     if (open) setForm(initial || EMPTY_FORM);
//   }, [open, initial]);

//   if (!open) return null;

//   const update = (key) => (e) => {
//     const val =
//       e && e.target
//         ? e.target.type === "checkbox"
//           ? e.target.checked
//           : e.target.value
//         : e;
//     setForm((f) => ({ ...f, [key]: val }));
//   };

//   const field = (label, key, opts = {}) => (
//     <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//       <label
//         style={{
//           fontSize: 12,
//           color: "var(--text2)",
//           fontWeight: 600,
//           textTransform: "uppercase",
//           letterSpacing: "0.5px",
//         }}
//       >
//         {label}
//         {opts.required && <span style={{ color: "#f87171" }}> *</span>}
//       </label>
//       {opts.textarea ? (
//         <textarea
//           value={form[key] ?? ""}
//           onChange={update(key)}
//           rows={opts.rows || 3}
//           placeholder={opts.placeholder}
//           style={inputStyle}
//         />
//       ) : opts.select ? (
//         <select value={form[key] ?? ""} onChange={update(key)} style={inputStyle}>
//           <option value="">Select {label}</option>
//           {opts.options.map((o) => (
//             <option key={o} value={o}>
//               {o}
//             </option>
//           ))}
//         </select>
//       ) : (
//         <input
//           type={opts.type || "text"}
//           value={form[key] ?? ""}
//           onChange={update(key)}
//           placeholder={opts.placeholder}
//           style={inputStyle}
//         />
//       )}
//     </div>
//   );

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!form.sku || !form.productName) return;
//     onSave(form);
//   };

//   return (
//     <div style={overlayStyle}>
//       <div
//         style={{
//           background: "var(--surface)",
//           border: "1px solid var(--border)",
//           borderRadius: "var(--radius)",
//           width: "min(880px, 94vw)",
//           maxHeight: "90vh",
//           overflowY: "auto",
//           padding: 28,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 24,
//           }}
//         >
//           <h2
//             style={{
//               fontFamily: "'Playfair Display', serif",
//               fontSize: 24,
//               margin: 0,
//             }}
//           >
//             {form.id ? "Edit Product" : "Add Product"}
//           </h2>
//           <button onClick={onClose} style={iconButtonStyle} aria-label="Close">
//             <FaTimes />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit}>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
//             {field("SKU", "sku", { required: true, placeholder: "SKU-00123" })}
//             {field("Product Name", "productName", { required: true })}
//             {field("Brand", "brand")}
//             {field("Category", "category", { select: true, options: CATEGORY_OPTIONS })}
//             {field("Sub Category", "subCategory")}
//             {field("Manufacturer", "manufacturer")}
//             {field("Price", "price", { type: "number", placeholder: "0.00" })}
//             {field("MRP", "mrp", { type: "number", placeholder: "0.00" })}
//             {field("Stock", "stock", { type: "number", placeholder: "0" })}
//             {field("Weight (kg)", "weight", { type: "number", placeholder: "0.0" })}
//             {field("Dimensions", "dimensions", { placeholder: "L x W x H cm" })}
//             {field("Color", "color")}
//             {field("Size", "size")}
//             {field("Material", "material")}
//             {field("Country of Origin", "countryOfOrigin")}
//             {field("Status", "status", { select: true, options: STATUS_OPTIONS })}
//             {field("Image URL", "imageUrl", { placeholder: "https://..." })}
//             {field("Tags", "tags", { placeholder: "comma, separated, tags" })}
//           </div>

//           <div style={{ marginTop: 16 }}>
//             {field("Short Description", "shortDescription", { textarea: true, rows: 2 })}
//           </div>
//           <div style={{ marginTop: 16 }}>
//             {field("Long Description", "longDescription", { textarea: true, rows: 4 })}
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
//             <input
//               id="isActive"
//               type="checkbox"
//               checked={!!form.isActive}
//               onChange={update("isActive")}
//               style={{ width: 16, height: 16 }}
//             />
//             <label htmlFor="isActive" style={{ fontSize: 14, color: "var(--text2)" }}>
//               Product is active and visible on storefront
//             </label>
//           </div>

//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 12,
//               marginTop: 28,
//               borderTop: "1px solid var(--border)",
//               paddingTop: 20,
//             }}
//           >
//             <button type="button" onClick={onClose} style={secondaryButtonStyle}>
//               Cancel
//             </button>
//             <button type="submit" style={primaryButtonStyle} disabled={saving}>
//               {saving ? (
//                 <>
//                   <FaSpinner className="spin" /> Saving...
//                 </>
//               ) : form.id ? (
//                 "Save Changes"
//               ) : (
//                 "Create Product"
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // ==========================================
// // DELETE CONFIRM MODAL
// // ==========================================

// function DeleteConfirmModal({ product, onCancel, onConfirm, deleting }) {
//   if (!product) return null;
//   return (
//     <div style={overlayStyle}>
//       <div
//         style={{
//           background: "var(--surface)",
//           border: "1px solid var(--border)",
//           borderRadius: "var(--radius)",
//           width: "min(420px, 92vw)",
//           padding: 26,
//         }}
//       >
//         <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 10 }}>
//           Delete Product
//         </h3>
//         <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 24 }}>
//           Are you sure you want to delete <strong>{product.productName}</strong> (
//           {product.sku})? This can be undone from the deleted items list.
//         </p>
//         <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
//           <button onClick={onCancel} style={secondaryButtonStyle}>
//             Cancel
//           </button>
//           <button
//             onClick={() => onConfirm(product)}
//             style={{ ...primaryButtonStyle, background: "#dc2626" }}
//             disabled={deleting}
//           >
//             {deleting ? "Deleting..." : "Delete"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ==========================================
// // SHARED STYLES
// // ==========================================

// const inputStyle = {
//   background: "var(--surface2)",
//   border: "1px solid var(--border)",
//   borderRadius: 8,
//   padding: "10px 12px",
//   color: "var(--text)",
//   fontSize: 14,
//   outline: "none",
//   width: "100%",
//   boxSizing: "border-box",
//   fontFamily: "inherit",
// };

// const overlayStyle = {
//   position: "fixed",
//   inset: 0,
//   background: "rgba(0,0,0,0.55)",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   zIndex: 999,
//   padding: 20,
// };

// const primaryButtonStyle = {
//   display: "flex",
//   alignItems: "center",
//   gap: 8,
//   padding: "11px 20px",
//   background: "var(--accent)",
//   color: "#fff",
//   border: "none",
//   borderRadius: 10,
//   fontWeight: 600,
//   fontSize: 14,
//   cursor: "pointer",
// };

// const secondaryButtonStyle = {
//   padding: "11px 20px",
//   background: "var(--surface2)",
//   color: "var(--text)",
//   border: "1px solid var(--border)",
//   borderRadius: 10,
//   fontWeight: 600,
//   fontSize: 14,
//   cursor: "pointer",
// };

// const iconButtonStyle = {
//   width: 34,
//   height: 34,
//   borderRadius: 8,
//   border: "1px solid var(--border)",
//   background: "var(--surface2)",
//   color: "var(--text2)",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   cursor: "pointer",
// };

// // ==========================================
// // MAIN COMPONENT
// // ==========================================

// function ProductManage() {
//   // data + pagination
//   const [products, setProducts] = useState([]);
//   const [totalCount, setTotalCount] = useState(0);
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(25);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // filters
//   const [search, setSearch] = useState("");
//   const [category, setCategory] = useState("");
//   const [brand, setBrand] = useState("");
//   const [status, setStatus] = useState("");
//   const [minPrice, setMinPrice] = useState("");
//   const [maxPrice, setMaxPrice] = useState("");
//   const [stockFilter, setStockFilter] = useState(""); // "in" | "out" | ""
//   const [showFilters, setShowFilters] = useState(false);

//   const debouncedSearch = useDebouncedValue(search, 400);

//   // modals
//   const [formOpen, setFormOpen] = useState(false);
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [deleteTarget, setDeleteTarget] = useState(null);
//   const [deleting, setDeleting] = useState(false);
//   const [pushingId, setPushingId] = useState(null);

//   const [toast, setToast] = useState(null);
//   const notify = (message, type = "success") => setToast({ message, type });

//   const abortRef = useRef(null);

//   const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

//   const fetchProducts = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     if (abortRef.current) abortRef.current.abort();
//     const controller = new AbortController();
//     abortRef.current = controller;

//     const params = new URLSearchParams({
//       page: String(page),
//       pageSize: String(pageSize),
//     });
//     if (debouncedSearch) params.set("search", debouncedSearch);
//     if (category) params.set("category", category);
//     if (brand) params.set("brand", brand);
//     if (status) params.set("status", status);
//     if (minPrice) params.set("minPrice", minPrice);
//     if (maxPrice) params.set("maxPrice", maxPrice);
//     if (stockFilter) params.set("stockFilter", stockFilter);

//     try {
//       // const res = await fetch(`${API_BASE}?${params.toString()}`, {
//       //   signal: controller.signal,
//       const res = await api.get(API_BASE, { params: Object.fromEntries(params), signal: controller.signal });
//       const data = res.data;
      
//       // if (!res.ok) throw new Error(`Request failed (${res.status})`);
//       // const data = await res.json();

//       const rows = data.items || data.Items || data.data || data;
//       const total =
//         data.totalCount ?? data.TotalCount ?? data.total ?? (Array.isArray(rows) ? rows.length : 0);

//       setProducts((Array.isArray(rows) ? rows : []).map(mapProductFromApi));
//       setTotalCount(total);
//     } catch (err) {
//       if (err.name !== "AbortError") {
//         setError("Couldn't load products. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [page, pageSize, debouncedSearch, category, brand, status, minPrice, maxPrice, stockFilter]);

//   useEffect(() => {
//     fetchProducts();
//   }, [fetchProducts]);

//   // reset to page 1 whenever a filter changes
//   useEffect(() => {
//     setPage(1);
//   }, [debouncedSearch, category, brand, status, minPrice, maxPrice, stockFilter, pageSize]);

//   const resetFilters = () => {
//     setSearch("");
//     setCategory("");
//     setBrand("");
//     setStatus("");
//     setMinPrice("");
//     setMaxPrice("");
//     setStockFilter("");
//   };

//   const activeFilterCount = [category, brand, status, minPrice, maxPrice, stockFilter].filter(
//     Boolean
//   ).length;

//   // ---------- CRUD ----------

//   const openCreate = () => {
//     setEditingProduct(EMPTY_FORM);
//     setFormOpen(true);
//   };

//   const openEdit = (product) => {
//     setEditingProduct(product);
//     setFormOpen(true);
//   };

//   const handleSave = async (form) => {
//     setSaving(true);
//     try {
//       const res = isEdit
//   ? await api.put(`${API_BASE}/${form.id}`, mapProductToApi(form))
//   : await api.post(API_BASE, mapProductToApi(form));
//       const url = isEdit ? `${API_BASE}/${form.id}` : API_BASE;
//        res = await fetch(url, {
//         method: isEdit ? "PUT" : "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(mapProductToApi(form)),
//       });
//       if (!res.ok) throw new Error(`Save failed (${res.status})`);

//       notify(isEdit ? "Product updated." : "Product created.");
//       setFormOpen(false);
//       setEditingProduct(null);
//       fetchProducts();
//     } catch (err) {
//       notify("Couldn't save the product. Please try again.", "error");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (product) => {
//     setDeleting(true);
//     try {
//       const res = await fetch(`${API_BASE}/${product.id}`, { method: "DELETE" });
//       if (!res.ok) throw new Error(`Delete failed (${res.status})`);
//       notify("Product deleted.");
//       setDeleteTarget(null);

//       // if we deleted the last row on this page, step back a page
//       if (products.length === 1 && page > 1) {
//         setPage((p) => p - 1);
//       } else {
//         fetchProducts();
//       }
//     } catch (err) {
//       notify("Couldn't delete the product. Please try again.", "error");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const handlePushToAmazon = async (product) => {
//     setPushingId(product.id);
//     try {
//       const res = await fetch(`${API_BASE}/${product.id}/push-to-amazon`, {
//         method: "POST",
//       });
//       if (!res.ok) throw new Error(`Push failed (${res.status})`);
//       notify(`${product.productName} pushed to Amazon.`);
//       fetchProducts();
//     } catch (err) {
//       notify("Couldn't push this product to Amazon.", "error");
//     } finally {
//       setPushingId(null);
//     }
//   };

//   // ---------- RENDER ----------

//   return (
//     <div style={{ padding: "32px" }}>
//       <style>{`
//         .spin { animation: pm-spin 0.9s linear infinite; }
//         @keyframes pm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
//         .pm-row:hover { background: var(--surface2); }
//         .pm-icon-btn:hover { border-color: var(--accent); color: var(--accent); }
//       `}</style>

//       {/* HEADER */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "flex-start",
//           marginBottom: 28,
//           flexWrap: "wrap",
//           gap: 16,
//         }}
//       >
//         <div>
//           <h1
//             style={{
//               fontFamily: "'Playfair Display', serif",
//               fontSize: 32,
//               fontWeight: 700,
//               marginBottom: 6,
//             }}
//           >
//             Manage Products
//           </h1>
//           <p style={{ color: "var(--text2)", fontSize: 15 }}>
//             {totalCount.toLocaleString()} product{totalCount === 1 ? "" : "s"} in your catalog.
//           </p>
//         </div>

//         <button onClick={openCreate} style={primaryButtonStyle}>
//           <FaPlus /> Add Product
//         </button>
//       </div>

//       {/* FILTER BAR */}
//       <div
//         style={{
//           background: "var(--surface)",
//           border: "1px solid var(--border)",
//           borderRadius: "var(--radius)",
//           padding: 20,
//           marginBottom: 20,
//         }}
//       >
//         <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
//           <div style={{ position: "relative", flex: "1 1 260px" }}>
//             <FaSearch
//               style={{
//                 position: "absolute",
//                 left: 12,
//                 top: "50%",
//                 transform: "translateY(-50%)",
//                 color: "var(--text2)",
//                 fontSize: 13,
//               }}
//             />
//             <input
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search by SKU or product name..."
//               style={{ ...inputStyle, paddingLeft: 34 }}
//             />
//           </div>

//           <button
//             onClick={() => setShowFilters((s) => !s)}
//             style={{
//               ...secondaryButtonStyle,
//               display: "flex",
//               alignItems: "center",
//               gap: 8,
//               background: showFilters ? "var(--accent)" : "var(--surface2)",
//               color: showFilters ? "#fff" : "var(--text)",
//               borderColor: showFilters ? "var(--accent)" : "var(--border)",
//             }}
//           >
//             <FaFilter />
//             Filters
//             {activeFilterCount > 0 && (
//               <span
//                 style={{
//                   background: "#fff",
//                   color: "var(--accent)",
//                   borderRadius: 999,
//                   fontSize: 11,
//                   fontWeight: 700,
//                   padding: "1px 7px",
//                 }}
//               >
//                 {activeFilterCount}
//               </span>
//             )}
//           </button>

//           {(activeFilterCount > 0 || search) && (
//             <button onClick={resetFilters} style={{ ...secondaryButtonStyle }}>
//               Clear all
//             </button>
//           )}
//         </div>

//         {showFilters && (
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
//               gap: 14,
//               marginTop: 18,
//               paddingTop: 18,
//               borderTop: "1px solid var(--border)",
//             }}
//           >
//             <div>
//               <label style={filterLabelStyle}>Category</label>
//               <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
//                 <option value="">All Categories</option>
//                 {CATEGORY_OPTIONS.map((c) => (
//                   <option key={c} value={c}>
//                     {c}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label style={filterLabelStyle}>Brand</label>
//               <input
//                 value={brand}
//                 onChange={(e) => setBrand(e.target.value)}
//                 placeholder="Any brand"
//                 style={inputStyle}
//               />
//             </div>

//             <div>
//               <label style={filterLabelStyle}>Status</label>
//               <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
//                 <option value="">All Statuses</option>
//                 {STATUS_OPTIONS.map((s) => (
//                   <option key={s} value={s}>
//                     {s}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label style={filterLabelStyle}>Stock</label>
//               <select
//                 value={stockFilter}
//                 onChange={(e) => setStockFilter(e.target.value)}
//                 style={inputStyle}
//               >
//                 <option value="">Any</option>
//                 <option value="in">In Stock</option>
//                 <option value="out">Out of Stock</option>
//               </select>
//             </div>

//             <div>
//               <label style={filterLabelStyle}>Min Price</label>
//               <input
//                 type="number"
//                 value={minPrice}
//                 onChange={(e) => setMinPrice(e.target.value)}
//                 placeholder="0"
//                 style={inputStyle}
//               />
//             </div>

//             <div>
//               <label style={filterLabelStyle}>Max Price</label>
//               <input
//                 type="number"
//                 value={maxPrice}
//                 onChange={(e) => setMaxPrice(e.target.value)}
//                 placeholder="Any"
//                 style={inputStyle}
//               />
//             </div>
//           </div>
//         )}
//       </div>

//       {/* TABLE */}
//       <div
//         style={{
//           background: "var(--surface)",
//           border: "1px solid var(--border)",
//           borderRadius: "var(--radius)",
//           overflow: "hidden",
//         }}
//       >
//         <div style={{ overflowX: "auto" }}>
//           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
//             <thead>
//               <tr style={{ borderBottom: "1px solid var(--border)" }}>
//                 {["Product", "SKU", "Category", "Price", "MRP", "Stock", "Status", "Actions"].map(
//                   (h) => (
//                     <th
//                       key={h}
//                       style={{
//                         textAlign: h === "Actions" ? "right" : "left",
//                         padding: "14px 16px",
//                         color: "var(--text2)",
//                         fontSize: 12,
//                         fontWeight: 600,
//                         textTransform: "uppercase",
//                         letterSpacing: "0.6px",
//                         whiteSpace: "nowrap",
//                       }}
//                     >
//                       {h}
//                     </th>
//                   )
//                 )}
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>
//                     <FaSpinner className="spin" style={{ marginRight: 8 }} />
//                     Loading products...
//                   </td>
//                 </tr>
//               ) : error ? (
//                 <tr>
//                   <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#f87171" }}>
//                     {error}
//                   </td>
//                 </tr>
//               ) : products.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} style={{ padding: 48, textAlign: "center", color: "var(--text2)" }}>
//                     <FaBoxOpen size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
//                     <div>No products match these filters.</div>
//                   </td>
//                 </tr>
//               ) : (
//                 products.map((p) => (
//                   <tr key={p.id} className="pm-row" style={{ borderBottom: "1px solid var(--border)" }}>
//                     <td style={{ padding: "14px 16px" }}>
//                       <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//                         <div
//                           style={{
//                             width: 40,
//                             height: 40,
//                             borderRadius: 8,
//                             background: "var(--surface2)",
//                             overflow: "hidden",
//                             flexShrink: 0,
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                           }}
//                         >
//                           {p.imageUrl ? (
//                             <img
//                               src={p.imageUrl}
//                               alt={p.productName}
//                               style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                               onError={(e) => (e.target.style.display = "none")}
//                             />
//                           ) : (
//                             <FaBoxOpen color="var(--text2)" />
//                           )}
//                         </div>
//                         <div>
//                           <div style={{ fontWeight: 600 }}>{p.productName || "Untitled"}</div>
//                           <div style={{ fontSize: 12, color: "var(--text2)" }}>{p.brand}</div>
//                         </div>
//                       </div>
//                     </td>
//                     <td style={{ padding: "14px 16px", color: "var(--text2)" }}>{p.sku}</td>
//                     <td style={{ padding: "14px 16px" }}>{p.category || "-"}</td>
//                     <td style={{ padding: "14px 16px", fontWeight: 600 }}>{currency(p.price)}</td>
//                     <td style={{ padding: "14px 16px", color: "var(--text2)" }}>{currency(p.mrp)}</td>
//                     <td style={{ padding: "14px 16px" }}>
//                       <span style={{ color: p.stock > 0 ? "var(--success)" : "#f87171" }}>
//                         {p.stock > 0 ? p.stock : "Out of stock"}
//                       </span>
//                     </td>
//                     <td style={{ padding: "14px 16px" }}>
//                       <span
//                         style={{
//                           fontSize: 12,
//                           fontWeight: 600,
//                           padding: "4px 10px",
//                           borderRadius: 999,
//                           background:
//                             p.status === "Active" ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)",
//                           color: p.status === "Active" ? "var(--success)" : "var(--text2)",
//                         }}
//                       >
//                         {p.status || "Unknown"}
//                       </span>
//                     </td>
//                     <td style={{ padding: "14px 16px" }}>
//                       <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
//                         <button
//                           className="pm-icon-btn"
//                           title="Push to Amazon"
//                           onClick={() => handlePushToAmazon(p)}
//                           disabled={pushingId === p.id}
//                           style={{ ...iconButtonStyle, color: "#ff9900" }}
//                         >
//                           {pushingId === p.id ? <FaSpinner className="spin" /> : <FaAmazon />}
//                         </button>
//                         <button
//                           className="pm-icon-btn"
//                           title="Edit"
//                           onClick={() => openEdit(p)}
//                           style={iconButtonStyle}
//                         >
//                           <FaEdit />
//                         </button>
//                         <button
//                           className="pm-icon-btn"
//                           title="Delete"
//                           onClick={() => setDeleteTarget(p)}
//                           style={{ ...iconButtonStyle, color: "#f87171" }}
//                         >
//                           <FaTrash />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* PAGINATION */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             padding: "16px 20px",
//             borderTop: "1px solid var(--border)",
//             flexWrap: "wrap",
//             gap: 12,
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text2)" }}>
//             <span>Rows per page</span>
//             <select
//               value={pageSize}
//               onChange={(e) => setPageSize(Number(e.target.value))}
//               style={{ ...inputStyle, padding: "6px 10px", width: "auto" }}
//             >
//               {PAGE_SIZE_OPTIONS.map((n) => (
//                 <option key={n} value={n}>
//                   {n}
//                 </option>
//               ))}
//             </select>
//             <span>
//               {totalCount === 0
//                 ? "0 results"
//                 : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
//             </span>
//           </div>

//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <button
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               disabled={page <= 1}
//               style={{ ...iconButtonStyle, opacity: page <= 1 ? 0.4 : 1 }}
//             >
//               <FaChevronLeft />
//             </button>
//             <span style={{ fontSize: 13, color: "var(--text2)", minWidth: 90, textAlign: "center" }}>
//               Page {page} of {totalPages}
//             </span>
//             <button
//               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//               disabled={page >= totalPages}
//               style={{ ...iconButtonStyle, opacity: page >= totalPages ? 0.4 : 1 }}
//             >
//               <FaChevronRight />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* MODALS */}
//       <ProductFormModal
//         open={formOpen}
//         initial={editingProduct}
//         saving={saving}
//         onClose={() => {
//           setFormOpen(false);
//           setEditingProduct(null);
//         }}
//         onSave={handleSave}
//       />

//       <DeleteConfirmModal
//         product={deleteTarget}
//         deleting={deleting}
//         onCancel={() => setDeleteTarget(null)}
//         onConfirm={handleDelete}
//       />

//       <Toast toast={toast} onClose={() => setToast(null)} />
//     </div>
//   );
// }

// const filterLabelStyle = {
//   display: "block",
//   fontSize: 11,
//   color: "var(--text2)",
//   fontWeight: 600,
//   textTransform: "uppercase",
//   letterSpacing: "0.5px",
//   marginBottom: 6,
// };

// export default ProductManage;


import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaAmazon,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaBoxOpen,
  FaFilter,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import axios from "axios";
import env from "../../../config/env";
import categoryService from "../../../services/categoryService";

// ==========================================
// CONFIG / API CLIENT
// ==========================================

const API_BASE = `${env.DIGITAL_API_URL}/Product`; // matches ProductController route

const getToken = () => localStorage.getItem("accessToken");

const api = axios.create({ baseURL: env.DIGITAL_API_URL });
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const STATUS_OPTIONS = ["Active", "Inactive", "Draft", "OutOfStock"];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const EMPTY_FORM = {
  id: null,
  sku: "",
  productName: "",
  brand: "",
  category: "",
  subCategory: "",
  shortDescription: "",
  longDescription: "",
  price: "",
  mrp: "",
  stock: "",
  weight: "",
  dimensions: "",
  material: "",
  color: "",
  size: "",
  countryOfOrigin: "",
  manufacturer: "",
  tags: "",
  imageUrl: "",
  imageUrls: [],
  newImages: [],
  isActive: true,
  status: "Active",
};

// ==========================================
// SMALL HELPERS
// ==========================================

function currency(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Maps a Products row coming back from the API (PascalCase, matching the
// SQL table / C# model) into the camelCase shape the form + table use.
function mapProductFromApi(p) {
  const imageUrl = p.Imageurl ?? p.ImageUrl ?? p.imageUrl ?? p.imageurl ?? "";
  const images = p.ImageUrls ?? p.imageUrls ?? p.Images ?? p.images ?? p.ProductImages ?? p.productImages;
  return {
    id: p.Id ?? p.id,
    sku: p.SKU ?? p.sku ?? "",
    productName: p.ProductsName ?? p.productsName ?? p.ProductName ?? p.productName ?? "",
    brand: p.Brand ?? p.brand ?? "",
    category: p.Category ?? p.category ?? "",
    subCategory: p.SubCategory ?? p.subCategory ?? "",
    shortDescription: p.ShortDescription ?? p.shortDescription ?? "",
    longDescription: p.LongDescription ?? p.longDescription ?? "",
    price: p.Price ?? p.price ?? 0,
    mrp: p.MRP ?? p.mrp ?? 0,
    stock: p.Stock ?? p.stock ?? 0,
    weight: p.Weight ?? p.weight ?? "",
    dimensions: p.Dimensions ?? p.dimensions ?? "",
    material: p.Material ?? p.material ?? "",
    color: p.Color ?? p.color ?? "",
    size: p.Size ?? p.size ?? "",
    countryOfOrigin: p.CountryOfOrigin ?? p.countryOfOrigin ?? "",
    manufacturer: p.Manufacturer ?? p.manufacturer ?? "",
    tags: p.Tags ?? p.tags ?? "",
    imageUrl,
    imageUrls: Array.isArray(images)
      ? images.map((image) => typeof image === "string" ? image : image?.ImageUrl ?? image?.imageUrl ?? image?.Url ?? image?.url).filter(Boolean)
      : imageUrl ? [imageUrl] : [],
    newImages: [],
    isActive: p.IsActive ?? p.isActive ?? true,
    isDeleted: p.IsDeleted ?? p.isDeleted ?? false,
    status: p.Status ?? p.status ?? "Active",
    amazonPushed: p.AmazonPushed ?? p.amazonPushed ?? false,
    approvalStatus: p.ApprovalStatus ?? p.approvalStatus ?? "Pending",
    rejectionReason: p.RejectionReason ?? p.rejectionReason ?? "",
  };
}

// Maps the camelCase form state back to the PascalCase payload the API
// (backed by the Products / BaseModel classes) expects.
// NOTE: your controller's Create endpoint reads `request.ProductsName` and
// `request.CompanyId` from ProductsDTO, so those are included here.
function mapProductToApi(f) {
  return {
    Id: f.id || undefined,
    CompanyId: f.companyId, // wire this up from auth/user context if required by the API
    SKU: f.sku,
    ProductsName: f.productName,
    Brand: f.brand,
    Category: f.category,
    SubCategory: f.subCategory,
    ShortDescription: f.shortDescription,
    LongDescription: f.longDescription,
    Price: Number(f.price) || 0,
    MRP: Number(f.mrp) || 0,
    Stock: parseInt(f.stock, 10) || 0,
    Weight: Number(f.weight) || 0,
    Dimensions: f.dimensions,
    Material: f.material,
    Color: f.color,
    Size: f.size,
    CountryOfOrigin: f.countryOfOrigin,
    Manufacturer: f.manufacturer,
    Tags: f.tags,
    Imageurl: f.imageUrls?.[0] ?? f.imageUrl ?? "",
    ImageUrls: f.imageUrls ?? [],
    IsActive: f.isActive,
    Status: f.status,
  };
}

function getSavedProductId(response) {
  let payload = response?.data ?? response;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) break;
    const id = payload.Id ?? payload.id ?? payload.ProductId ?? payload.productId;
    if (id !== undefined && id !== null && id !== "") return id;
    payload = payload.Data ?? payload.data;
  }
  return null;
}

// ==========================================
// TOAST
// ==========================================

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 18px",
        borderRadius: "var(--radius)",
        background: isError ? "#3b1414" : "#0f2e1f",
        border: `1px solid ${isError ? "#b91c1c" : "var(--success)"}`,
        color: "#fff",
        minWidth: 260,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      {isError ? (
        <FaExclamationCircle color="#f87171" />
      ) : (
        <FaCheckCircle color="var(--success)" />
      )}
      <span style={{ fontSize: 14 }}>{toast.message}</span>
    </div>
  );
}

// ==========================================
// PRODUCT FORM (Add / Edit) MODAL
// ==========================================

function ProductFormModal({ open, initial, onClose, onSave, saving, categories }) {
  const [form, setForm] = useState(() => {
    const initialForm = initial || EMPTY_FORM;
    return {
      ...EMPTY_FORM,
      ...initialForm,
      imageUrls: initialForm.imageUrls?.length
        ? initialForm.imageUrls
        : initialForm.imageUrl ? [initialForm.imageUrl] : [],
      newImages: [],
    };
  });

  if (!open) return null;

  const update = (key) => (e) => {
    const val =
      e && e.target
        ? e.target.type === "checkbox"
          ? e.target.checked
          : e.target.value
        : e;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const field = (label, key, opts = {}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          color: "var(--text2)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
        {opts.required && <span style={{ color: "#f87171" }}> *</span>}
      </label>
      {opts.textarea ? (
        <textarea
          value={form[key] ?? ""}
          onChange={update(key)}
          rows={opts.rows || 3}
          placeholder={opts.placeholder}
          style={inputStyle}
        />
      ) : opts.select ? (
        <select value={form[key] ?? ""} onChange={update(key)} style={inputStyle}>
          <option value="">Select {label}</option>
          {opts.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={opts.type || "text"}
          value={form[key] ?? ""}
          onChange={update(key)}
          placeholder={opts.placeholder}
          style={inputStyle}
        />
      )}
    </div>
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.sku || !form.productName || !form.category) return;
    onSave(form);
  };
  const currentCategory = categories.find((item) => {
    const name = item.CategoryName ?? item.categoryName ?? item.Name ?? item.name;
    return name === form.category;
  });
  const subCategories =
    currentCategory?.SubCategories ??
    currentCategory?.subCategories ??
    currentCategory?.Subcategories ??
    currentCategory?.subcategories ??
    [];
  const getSubCategoryName = (item) =>
    item.SubCategoryName ?? item.subCategoryName ?? item.Name ?? item.name ?? "";

  return (
    <div style={overlayStyle}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          width: "min(880px, 94vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              margin: 0,
            }}
          >
            {form.id ? "Edit Product" : "Add Product"}
          </h2>
          <button onClick={onClose} style={iconButtonStyle} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {field("SKU", "sku", { required: true, placeholder: "SKU-00123" })}
            {field("Product Name", "productName", { required: true })}
            {field("Brand", "brand")}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</label>
              <select
                required
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value, subCategory: "" }))}
                style={inputStyle}
              >
                <option value="">Select Category</option>
                {categories.map((item) => {
                  const name = item.CategoryName ?? item.categoryName ?? item.Name ?? item.name ?? "";
                  return <option key={item.Id ?? item.id ?? name} value={name}>{name}</option>;
                })}
                {form.category && !categories.some((item) => (item.CategoryName ?? item.categoryName ?? item.Name ?? item.name) === form.category) &&
                  <option value={form.category}>{form.category}</option>}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Sub Category</label>
              <select
                value={form.subCategory}
                onChange={update("subCategory")}
                disabled={!form.category}
                style={inputStyle}
              >
                <option value="">Select Sub Category</option>
                {subCategories.map((item) => {
                  const name = getSubCategoryName(item);
                  return <option key={item.Id ?? item.id ?? name} value={name}>{name}</option>;
                })}
                {form.subCategory && !subCategories.some((item) => getSubCategoryName(item) === form.subCategory) &&
                  <option value={form.subCategory}>{form.subCategory}</option>}
              </select>
            </div>
            {field("Manufacturer", "manufacturer")}
            {field("Price", "price", { type: "number", placeholder: "0.00" })}
            {field("MRP", "mrp", { type: "number", placeholder: "0.00" })}
            {field("Stock", "stock", { type: "number", placeholder: "0" })}
            {field("Weight (kg)", "weight", { type: "number", placeholder: "0.0" })}
            {field("Dimensions", "dimensions", { placeholder: "L x W x H cm" })}
            {field("Color", "color")}
            {field("Size", "size")}
            {field("Material", "material")}
            {field("Country of Origin", "countryOfOrigin")}
            {field("Status", "status", { select: true, options: STATUS_OPTIONS })}
            {field("Tags", "tags", { placeholder: "comma, separated, tags" })}
          </div>

          <div style={{ marginTop: 18 }}>
            <label htmlFor="product-images" style={{ display: "block", fontSize: 12, color: "var(--text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
              Product images
            </label>
            <input
              id="product-images"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                setForm((current) => ({ ...current, newImages: [...(current.newImages || []), ...files] }));
                event.target.value = "";
              }}
              style={{ ...inputStyle, padding: 8 }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
              {(form.imageUrls || []).map((url, index) => (
                <div key={`${url}-${index}`} style={{ position: "relative", width: 76, height: 76 }}>
                  <img src={url} alt={`Product image ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                  <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => setForm((current) => {
                    const imageUrls = current.imageUrls.filter((_, imageIndex) => imageIndex !== index);
                    return { ...current, imageUrls, imageUrl: imageUrls[0] || "" };
                  })} style={{ position: "absolute", top: 3, right: 3, width: 22, height: 22, border: 0, borderRadius: "50%", color: "#fff", background: "#dc2626", cursor: "pointer" }}>×</button>
                </div>
              ))}
              {(form.newImages || []).map((file, index) => (
                <div key={`${file.name}-${file.lastModified}-${index}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 8 }}>
                  <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{file.name}</span>
                  <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setForm((current) => ({ ...current, newImages: current.newImages.filter((_, fileIndex) => fileIndex !== index) }))} style={{ border: 0, color: "#dc2626", background: "transparent", cursor: "pointer" }}>×</button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)", margin: "8px 0 0" }}>Select multiple image files. The first image is used as the product cover; remove saved images by selecting ×.</p>
          </div>

          <div style={{ marginTop: 16 }}>
            {field("Short Description", "shortDescription", { textarea: true, rows: 2 })}
          </div>
          <div style={{ marginTop: 16 }}>
            {field("Long Description", "longDescription", { textarea: true, rows: 4 })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
            <input
              id="isActive"
              type="checkbox"
              checked={!!form.isActive}
              onChange={update("isActive")}
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="isActive" style={{ fontSize: 14, color: "var(--text2)" }}>
              Product is active and visible on storefront
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 28,
              borderTop: "1px solid var(--border)",
              paddingTop: 20,
            }}
          >
            <button type="button" onClick={onClose} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? (
                <>
                  <FaSpinner className="spin" /> Saving...
                </>
              ) : form.id ? (
                "Save Changes"
              ) : (
                "Create Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// DELETE CONFIRM MODAL
// ==========================================

function DeleteConfirmModal({ product, onCancel, onConfirm, deleting }) {
  if (!product) return null;
  return (
    <div style={overlayStyle}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          width: "min(420px, 92vw)",
          padding: 26,
        }}
      >
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 10 }}>
          Delete Product
        </h3>
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 24 }}>
          Are you sure you want to delete <strong>{product.productName}</strong> (
          {product.sku})? This can be undone from the deleted items list.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onCancel} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(product)}
            style={{ ...primaryButtonStyle, background: "#dc2626" }}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SHARED STYLES
// ==========================================

const inputStyle = {
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
  padding: 20,
};

const primaryButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 20px",
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "11px 20px",
  background: "var(--surface2)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const iconButtonStyle = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface2)",
  color: "var(--text2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const filterLabelStyle = {
  display: "block",
  fontSize: 11,
  color: "var(--text2)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 6,
};

// ==========================================
// MAIN COMPONENT
// ==========================================

function ProductManage() {
  const [categories, setCategories] = useState([]);
  const [categoryLoadError, setCategoryLoadError] = useState("");
  // data + pagination
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockFilter, setStockFilter] = useState(""); // "in" | "out" | ""
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 400);

  // modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [pushingId, setPushingId] = useState(null);

  const [toast, setToast] = useState(null);
  const notify = (message, type = "success") => setToast({ message, type });

  const abortRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    let active = true;
    categoryService.getCategories()
      .then((rows) => {
        if (active) {
          setCategories(rows);
          setCategoryLoadError("");
        }
      })
      .catch((loadError) => {
        console.error("Failed to load product categories:", loadError);
        if (active) setCategoryLoadError("Categories could not be loaded; check the category API.");
      });
    return () => { active = false; };
  }, []);

  // ---------- LOAD (runs on mount + whenever paging/filters change) ----------

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = { page, pageSize };
    if (debouncedSearch) params.search = debouncedSearch;
    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (status) params.status = status;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (stockFilter) params.stockFilter = stockFilter;

    try {
      const res = await api.get(API_BASE + '/GetAllAdmin', { params, signal: controller.signal });

      // Controller wraps results in ApiResponse<object>: { Success, Data, Message }
      // Data itself is a PagedResult<Products>: { Items, TotalCount }
      const payload = res.data?.Data ?? res.data?.data ?? res.data;
      const rows = payload?.items ?? payload?.Items ?? payload ?? [];
      const total =
        payload?.totalCount ?? payload?.TotalCount ?? (Array.isArray(rows) ? rows.length : 0);

      setProducts((Array.isArray(rows) ? rows : []).map(mapProductFromApi));
      setTotalCount(total);
    } catch (err) {
      const cancelled = err.code === "ERR_CANCELED" || err.name === "CanceledError";
      if (!cancelled) {
        console.error("fetchProducts failed:", err);
        setError("Couldn't load products. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, category, brand, status, minPrice, maxPrice, stockFilter]);

  // initial load + reload on any dependency change (covers "on page load, list all products")
  useEffect(() => {
    const loadTimer = window.setTimeout(() => fetchProducts(), 0);
    // cleanup any in-flight request when the component unmounts
    return () => {
      window.clearTimeout(loadTimer);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchProducts]);

  const resetFilters = () => {
    setPage(1);
    setSearch("");
    setCategory("");
    setBrand("");
    setStatus("");
    setMinPrice("");
    setMaxPrice("");
    setStockFilter("");
  };

  const activeFilterCount = [category, brand, status, minPrice, maxPrice, stockFilter].filter(
    Boolean
  ).length;

  // ---------- CRUD ----------

  const openCreate = () => {
    setEditingProduct(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleSave = async (form) => {
    setSaving(true);
    const isEdit = !!form.id;
    try {
      let productId = form.id;
      let imageUrls = form.imageUrls ?? [];
      const productPayload = mapProductToApi({ ...form, imageUrls });

      if (isEdit) {
        await api.put(`${API_BASE + "/Update"}/${productId}`, productPayload);
      } else {
        const createResponse = await api.post(`${API_BASE}/Create`, productPayload);
        productId = getSavedProductId(createResponse);
        if (!productId) {
          throw new Error("The product was created, but the API did not return its product ID. Images cannot be linked.");
        }
      }

      if (form.newImages?.length) {
        const imageData = new FormData();
        imageData.append("productId", String(productId));
        form.newImages.forEach((image) => imageData.append("images", image));
        const uploadResponse = await api.post(`${API_BASE}/UploadImages`, imageData);
        const uploadPayload = uploadResponse.data?.Data ?? uploadResponse.data?.data ?? uploadResponse.data;
        const uploaded = uploadPayload?.imageUrls ?? uploadPayload?.ImageUrls ?? uploadPayload?.images ?? uploadPayload?.Images;
        if (!Array.isArray(uploaded) || uploaded.length !== form.newImages.length) {
          throw new Error("The image upload API returned an invalid image URL list.");
        }
        imageUrls = [...imageUrls, ...uploaded.map((image) => typeof image === "string" ? image : image?.ImageUrl ?? image?.imageUrl ?? image?.Url ?? image?.url)];
        if (imageUrls.some((url) => !url)) {
          throw new Error("The image upload API returned an image without a URL.");
        }
        await api.put(
          `${API_BASE + "/Update"}/${productId}`,
          mapProductToApi({ ...form, id: productId, imageUrls })
        );
      }
      notify(isEdit ? "Product updated." : "Product created.");
      setFormOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) {
      console.error("handleSave failed:", err);
      notify(err.response?.data?.message || err.message || "Couldn't save the product. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    setDeleting(true);
    try {
      await api.delete(`${API_BASE + '/Delete'}/${product.id}`);
      notify("Product deleted.");
      setDeleteTarget(null);

      // if we deleted the last row on this page, step back a page (which
      // triggers fetchProducts via the effect above); otherwise refetch now
      if (products.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await fetchProducts();
      }
    } catch (err) {
      console.error("handleDelete failed:", err);
      notify("Couldn't delete the product. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handlePushToAmazon = async (product) => {
    setPushingId(product.id);
    try {
      await api.post(`${API_BASE + '/PushToAmazon'}/${product.id}`);
      notify(`${product.productName} pushed to Amazon.`);
      await fetchProducts();
    } catch (err) {
      console.error("handlePushToAmazon failed:", err);
      notify("Couldn't push this product to Amazon.", "error");
    } finally {
      setPushingId(null);
    }
  };

  const handleApprove = async (product) => {
    setPushingId(product.id);
    try {
      await api.post(`${API_BASE}/Approve/${product.id}`);
      notify(`${product.productName} approved.`);
      await fetchProducts();
    } catch (err) {
      console.error("handleApprove failed:", err);
      notify("Couldn't approve this product.", "error");
    } finally {
      setPushingId(null);
    }
  };

  const handleReject = async (product) => {
    const reason = window.prompt(`Reason for rejecting "${product.productName}"?`, "");
    if (reason === null) return; // cancelled
    setPushingId(product.id);
    try {
      await api.post(`${API_BASE}/Reject/${product.id}`, { Reason: reason });
      notify(`${product.productName} rejected.`);
      await fetchProducts();
    } catch (err) {
      console.error("handleReject failed:", err);
      notify("Couldn't reject this product.", "error");
    } finally {
      setPushingId(null);
    }
  };

  // ---------- RENDER ----------

  return (
    <div style={{ padding: "32px" }}>
      <style>{`
        .spin { animation: pm-spin 0.9s linear infinite; }
        @keyframes pm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pm-row:hover { background: var(--surface2); }
        .pm-icon-btn:hover { border-color: var(--accent); color: var(--accent); }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Manage Products
          </h1>
          <p style={{ color: "var(--text2)", fontSize: 15 }}>
            {totalCount.toLocaleString()} product{totalCount === 1 ? "" : "s"} in your catalog.
          </p>
        </div>

        <button onClick={openCreate} style={primaryButtonStyle}>
          <FaPlus /> Add Product
        </button>
      </div>

      {categoryLoadError && (
        <div role="alert" style={{ padding: 12, marginBottom: 16, color: "#b91c1c", background: "#fee2e2", borderRadius: 8 }}>
          {categoryLoadError}
        </div>
      )}

      {/* FILTER BAR */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <FaSearch
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text2)",
                fontSize: 13,
              }}
            />
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search by SKU or product name..."
              style={{ ...inputStyle, paddingLeft: 34 }}
            />
          </div>

          <button
            onClick={() => setShowFilters((s) => !s)}
            style={{
              ...secondaryButtonStyle,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: showFilters ? "var(--accent)" : "var(--surface2)",
              color: showFilters ? "#fff" : "var(--text)",
              borderColor: showFilters ? "var(--accent)" : "var(--border)",
            }}
          >
            <FaFilter />
            Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: "#fff",
                  color: "var(--accent)",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {(activeFilterCount > 0 || search) && (
            <button onClick={resetFilters} style={{ ...secondaryButtonStyle }}>
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 14,
              marginTop: 18,
              paddingTop: 18,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div>
              <label style={filterLabelStyle}>Category</label>
              <select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }} style={inputStyle}>
                <option value="">All Categories</option>
                {categories.map((item) => {
                  const name = item.CategoryName ?? item.categoryName ?? item.Name ?? item.name ?? "";
                  return <option key={item.Id ?? item.id ?? name} value={name}>{name}</option>;
                })}
              </select>
            </div>

            <div>
              <label style={filterLabelStyle}>Brand</label>
              <input
                value={brand}
                onChange={(e) => { setPage(1); setBrand(e.target.value); }}
                placeholder="Any brand"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={filterLabelStyle}>Status</label>
              <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} style={inputStyle}>
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={filterLabelStyle}>Stock</label>
              <select
                value={stockFilter}
                onChange={(e) => { setPage(1); setStockFilter(e.target.value); }}
                style={inputStyle}
              >
                <option value="">Any</option>
                <option value="in">In Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>

            <div>
              <label style={filterLabelStyle}>Min Price</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => { setPage(1); setMinPrice(e.target.value); }}
                placeholder="0"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={filterLabelStyle}>Max Price</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => { setPage(1); setMaxPrice(e.target.value); }}
                placeholder="Any"
                style={inputStyle}
              />
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Product", "SKU", "Category", "Price", "MRP", "Stock", "Status", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "Actions" ? "right" : "left",
                        padding: "14px 16px",
                        color: "var(--text2)",
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>
                    <FaSpinner className="spin" style={{ marginRight: 8 }} />
                    Loading products...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#f87171" }}>
                    {error}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: "center", color: "var(--text2)" }}>
                    <FaBoxOpen size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
                    <div>No products match these filters.</div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="pm-row" style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: "var(--surface2)",
                            overflow: "hidden",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.productName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          ) : (
                            <FaBoxOpen color="var(--text2)" />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.productName || "Untitled"}</div>
                          <div style={{ fontSize: 12, color: "var(--text2)" }}>{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text2)" }}>{p.sku}</td>
                    <td style={{ padding: "14px 16px" }}>{p.category || "-"}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 600 }}>{currency(p.price)}</td>
                    <td style={{ padding: "14px 16px", color: "var(--text2)" }}>{currency(p.mrp)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ color: p.stock > 0 ? "var(--success)" : "#f87171" }}>
                        {p.stock > 0 ? p.stock : "Out of stock"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 999,
                          background:
                            p.status === "Active" ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)",
                          color: p.status === "Active" ? "var(--success)" : "var(--text2)",
                        }}
                      >
                        {p.status || "Unknown"}
                      </span>
                      <div style={{ marginTop: 6 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 999,
                            background:
                              p.approvalStatus === "Approved"
                                ? "rgba(34,197,94,0.15)"
                                : p.approvalStatus === "Rejected"
                                ? "rgba(248,113,113,0.15)"
                                : "rgba(234,179,8,0.15)",
                            color:
                              p.approvalStatus === "Approved"
                                ? "var(--success)"
                                : p.approvalStatus === "Rejected"
                                ? "#f87171"
                                : "#eab308",
                          }}
                          title={p.rejectionReason || undefined}
                        >
                          {p.approvalStatus === "Approved"
                            ? "Approved"
                            : p.approvalStatus === "Rejected"
                            ? "Rejected"
                            : "Pending Review"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        {p.approvalStatus !== "Approved" && (
                          <button
                            className="pm-icon-btn"
                            title="Approve product"
                            onClick={() => handleApprove(p)}
                            disabled={pushingId === p.id}
                            style={{ ...iconButtonStyle, color: "var(--success)" }}
                          >
                            {pushingId === p.id ? <FaSpinner className="spin" /> : <FaCheckCircle />}
                          </button>
                        )}
                        {p.approvalStatus !== "Rejected" && (
                          <button
                            className="pm-icon-btn"
                            title="Reject product"
                            onClick={() => handleReject(p)}
                            disabled={pushingId === p.id}
                            style={{ ...iconButtonStyle, color: "#f87171" }}
                          >
                            <FaExclamationCircle />
                          </button>
                        )}
                        <button
                          className="pm-icon-btn"
                          title={p.approvalStatus === "Approved" ? "Push to Amazon" : "Approve this product first"}
                          onClick={() => handlePushToAmazon(p)}
                          disabled={pushingId === p.id || p.approvalStatus !== "Approved"}
                          style={{ ...iconButtonStyle, color: "#ff9900", opacity: p.approvalStatus === "Approved" ? 1 : 0.4 }}
                        >
                          {pushingId === p.id ? <FaSpinner className="spin" /> : <FaAmazon />}
                        </button>
                        <button
                          className="pm-icon-btn"
                          title="Edit"
                          onClick={() => openEdit(p)}
                          style={iconButtonStyle}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="pm-icon-btn"
                          title="Delete"
                          onClick={() => setDeleteTarget(p)}
                          style={{ ...iconButtonStyle, color: "#f87171" }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderTop: "1px solid var(--border)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text2)" }}>
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
              style={{ ...inputStyle, padding: "6px 10px", width: "auto" }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>
              {totalCount === 0
                ? "0 results"
                : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ ...iconButtonStyle, opacity: page <= 1 ? 0.4 : 1 }}
            >
              <FaChevronLeft />
            </button>
            <span style={{ fontSize: 13, color: "var(--text2)", minWidth: 90, textAlign: "center" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{ ...iconButtonStyle, opacity: page >= totalPages ? 0.4 : 1 }}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <ProductFormModal
        key={`${formOpen}-${editingProduct?.id ?? "new"}`}
        open={formOpen}
        initial={editingProduct}
        saving={saving}
        categories={categories}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
      />

      <DeleteConfirmModal
        product={deleteTarget}
        deleting={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default ProductManage;
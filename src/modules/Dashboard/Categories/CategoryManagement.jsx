import { useCallback, useEffect, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import categoryService from "../../../services/categoryService";

const emptyCategory = { id: null, name: "", description: "", isActive: true };
const emptySubCategory = { id: null, categoryId: "", name: "", description: "", isActive: true };

function getCategoryId(item) {
  return item?.Id ?? item?.id ?? item?.categoryId;
}

function  getSubCategoryId(item) {
  return item?.Id ?? item?.id ?? item?.subCategoryId;
}

function getName(item) {
  return item?.CategoryName ?? item?.categoryName ??
    item?.SubCategoryName ?? item?.subCategoryName ??
    item?.Name ?? item?.name ?? "";
}

function getSubCategories(category) {
  const rows =
    category?.SubCategories ??
    category?.subCategories ??
    category?.Subcategories ??
    category?.subcategories ??
    [];
  return Array.isArray(rows) ? rows : [];
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  color: "var(--text)",
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  font: "inherit",
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "10px 14px",
  color: "#fff",
  background: "var(--accent)",
  border: 0,
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
};

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [subCategoryForm, setSubCategoryForm] = useState(emptySubCategory);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCategories(await categoryService.getCategories());
    } catch (loadError) {
      console.error("Failed to load categories:", loadError);
      setError("Unable to load categories. Check the category API and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    categoryService.getCategories()
      .then((rows) => {
        if (active) {
          setCategories(rows);
          setError("");
        }
      })
      .catch((loadError) => {
        console.error("Failed to load categories:", loadError);
        if (active) setError("Unable to load categories. Check the category API and try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const saveCategory = async (event) => {
    event.preventDefault();
    if (!categoryForm.name.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      CategoryName: categoryForm.name.trim(),
      Description: categoryForm.description.trim(),
      IsActive: categoryForm.isActive,
    };
    try {
      if (categoryForm.id) {
        await categoryService.updateCategory(categoryForm.id, payload);
        setNotice("Category updated.");
      } else {
        await categoryService.createCategory(payload);
        setNotice("Category created.");
      }
      setCategoryForm(emptyCategory);
      await loadCategories();
    } catch (saveError) {
      console.error("Failed to save category:", saveError);
      setError(saveError.response?.data?.message || "Unable to save this category.");
    } finally {
      setSaving(false);
    }
  };

  const saveSubCategory = async (event) => {
    event.preventDefault();
    if (!subCategoryForm.categoryId || !subCategoryForm.name.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      CategoryId: Number(subCategoryForm.categoryId),
      SubCategoryName: subCategoryForm.name.trim(),
      Description: subCategoryForm.description.trim(),
      IsActive: subCategoryForm.isActive,
    };
    try {
      if (subCategoryForm.id) {
        await categoryService.updateSubCategory(subCategoryForm.id, payload);
        setNotice("Subcategory updated.");
      } else {
        await categoryService.createSubCategory(payload);
        setNotice("Subcategory created.");
      }
      setSubCategoryForm(emptySubCategory);
      await loadCategories();
    } catch (saveError) {
      console.error("Failed to save subcategory:", saveError);
      setError(saveError.response?.data?.message || "Unable to save this subcategory.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${getName(category)}"? Categories linked to products cannot be deleted.`)) return;
    try {
      setError("");
      setNotice("");
      await categoryService.deleteCategory(getCategoryId(category));
      setNotice("Category deleted.");
      await loadCategories();
    } catch (deleteError) {
      console.error("Failed to delete category:", deleteError);
      setError(deleteError.response?.data?.message || "Unable to delete this category.");
    }
  };

  const deleteSubCategory = async (subCategory) => {
    if (!window.confirm(`Delete "${getName(subCategory)}"?`)) return;
    try {
      setError("");
      setNotice("");
      await categoryService.deleteSubCategory(getSubCategoryId(subCategory));
      setNotice("Subcategory deleted.");
      await loadCategories();
    } catch (deleteError) {
      console.error("Failed to delete subcategory:", deleteError);
      setError(deleteError.response?.data?.message || "Unable to delete this subcategory.");
    }
  };

  return (
    <main style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1, fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>
          Catalogue setup
        </p>
        <h1 style={{ margin: 0, fontSize: 28 }}>Categories &amp; subcategories</h1>
        <p style={{ color: "var(--text2)", marginBottom: 0 }}>
          Manage the category hierarchy used when products are created.
        </p>
      </header>

      {error && <div role="alert" style={{ padding: 12, marginBottom: 16, color: "#b91c1c", background: "#fee2e2", borderRadius: 8 }}>{error}</div>}
      {notice && <div role="status" style={{ padding: 12, marginBottom: 16, color: "#166534", background: "#dcfce7", borderRadius: 8 }}>{notice}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>
        <form onSubmit={saveCategory} style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>{categoryForm.id ? "Edit category" : "Create category"}</h2>
          <label htmlFor="category-name">Category name</label>
          <input id="category-name" required maxLength={100} value={categoryForm.name} onChange={(event) => setCategoryForm((form) => ({ ...form, name: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px" }} />
          <label htmlFor="category-description">Description</label>
          <textarea id="category-description" rows={3} value={categoryForm.description} onChange={(event) => setCategoryForm((form) => ({ ...form, description: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px", resize: "vertical" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <input type="checkbox" checked={categoryForm.isActive} onChange={(event) => setCategoryForm((form) => ({ ...form, isActive: event.target.checked }))} />
            Active
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={saving} style={buttonStyle}><FaPlus />{saving ? "Saving..." : categoryForm.id ? "Save category" : "Create category"}</button>
            {categoryForm.id && <button type="button" onClick={() => setCategoryForm(emptyCategory)} style={{ ...buttonStyle, color: "var(--text)", background: "var(--surface2)" }}>Cancel</button>}
          </div>
        </form>

        <form onSubmit={saveSubCategory} style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>{subCategoryForm.id ? "Edit subcategory" : "Create subcategory"}</h2>
          <label htmlFor="subcategory-parent">Parent category</label>
          <select id="subcategory-parent" required value={subCategoryForm.categoryId} onChange={(event) => setSubCategoryForm((form) => ({ ...form, categoryId: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px" }}>
            <option value="">Select a category</option>
            {categories.map((category) => <option key={getCategoryId(category)} value={getCategoryId(category)}>{getName(category)}</option>)}
          </select>
          <label htmlFor="subcategory-name">Subcategory name</label>
          <input id="subcategory-name" required maxLength={100} value={subCategoryForm.name} onChange={(event) => setSubCategoryForm((form) => ({ ...form, name: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px" }} />
          <label htmlFor="subcategory-description">Description</label>
          <textarea id="subcategory-description" rows={3} value={subCategoryForm.description} onChange={(event) => setSubCategoryForm((form) => ({ ...form, description: event.target.value }))} style={{ ...inputStyle, margin: "6px 0 14px", resize: "vertical" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <input type="checkbox" checked={subCategoryForm.isActive} onChange={(event) => setSubCategoryForm((form) => ({ ...form, isActive: event.target.checked }))} />
            Active
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={saving || categories.length === 0} style={buttonStyle}><FaPlus />{saving ? "Saving..." : subCategoryForm.id ? "Save subcategory" : "Create subcategory"}</button>
            {subCategoryForm.id && <button type="button" onClick={() => setSubCategoryForm(emptySubCategory)} style={{ ...buttonStyle, color: "var(--text)", background: "var(--surface2)" }}>Cancel</button>}
          </div>
        </form>
      </div>

      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Catalogue categories</h2>
        </div>
        {loading ? <p style={{ padding: 20, color: "var(--text2)" }}>Loading categories...</p> : categories.length === 0 ? <p style={{ padding: 20, color: "var(--text2)" }}>No categories have been created yet.</p> : (
          <div>
            {categories.map((category) => (
              <article key={getCategoryId(category)} style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>{getName(category)}</h3>
                    <p style={{ margin: 0, color: "var(--text2)", fontSize: 13 }}>{category.Description ?? category.description ?? "No description"} · {(category.IsActive ?? category.isActive) ? "Active" : "Inactive"}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" aria-label={`Edit ${getName(category)}`} onClick={() => setCategoryForm({ id: getCategoryId(category), name: getName(category), description: category.Description ?? category.description ?? "", isActive: category.IsActive ?? category.isActive ?? true })} style={{ ...buttonStyle, padding: 9 }}><FaEdit /></button>
                    <button type="button" aria-label={`Delete ${getName(category)}`} onClick={() => deleteCategory(category)} style={{ ...buttonStyle, padding: 9, background: "#dc2626" }}><FaTrash /></button>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                  {getSubCategories(category).map((subCategory) => (
                    <span key={getSubCategoryId(subCategory)} style={{ display: "inline-flex", gap: 8, alignItems: "center", padding: "6px 9px", borderRadius: 20, background: "var(--surface2)", color: "var(--text2)", fontSize: 13 }}>
                      {getName(subCategory)}
                      <button type="button" aria-label={`Edit ${getName(subCategory)}`} onClick={() => setSubCategoryForm({ id: getSubCategoryId(subCategory), categoryId: String(getCategoryId(category)), name: getName(subCategory), description: subCategory.Description ?? subCategory.description ?? "", isActive: subCategory.IsActive ?? subCategory.isActive ?? true })} style={{ border: 0, background: "transparent", color: "inherit", cursor: "pointer", padding: 2 }}><FaEdit size={11} /></button>
                      <button type="button" aria-label={`Delete ${getName(subCategory)}`} onClick={() => deleteSubCategory(subCategory)} style={{ border: 0, background: "transparent", color: "#dc2626", cursor: "pointer", padding: 2 }}><FaTrash size={11} /></button>
                    </span>
                  ))}
                  {getSubCategories(category).length === 0 && <span style={{ color: "var(--text2)", fontSize: 13 }}>No subcategories yet</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default CategoryManagement;

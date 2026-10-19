import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import productService, {
  getProductCategories,
  getProductCategory,
  getProductSubcategories,
  getProductSubcategory,
} from "../../../services/productService";

const selectedValues = (params, key) =>
  [...new Set(params.getAll(key).flatMap((value) => value.split(",")).filter(Boolean))];

const ProductList = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedCategories = selectedValues(params, "category");
  const selectedSubcategories = selectedValues(params, "subcategory");
  const searchQuery = (params.get("q") || "").trim().toLocaleLowerCase();
  const categoryFilterKey = selectedCategories.join("\u001f");
  const subcategoryFilterKey = selectedSubcategories.join("\u001f");

  useEffect(() => {
    let active = true;
    productService.getProducts()
      .then((data) => {
        if (active) {
          setAllProducts(data);
          if (!categoryFilterKey && !subcategoryFilterKey) setProducts(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load products:", error);
        if (active) setLoadError("Unable to load products right now. Please try again later.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!categoryFilterKey && !subcategoryFilterKey) {
      setProducts(allProducts);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setLoadError("");
    productService.getProducts({
      categories: categoryFilterKey ? categoryFilterKey.split("\u001f") : [],
      subcategories: subcategoryFilterKey ? subcategoryFilterKey.split("\u001f") : [],
    })
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((error) => {
        console.error("Failed to load filtered products:", error);
        if (active) setLoadError("Unable to load the selected products right now.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [categoryFilterKey, subcategoryFilterKey, allProducts]);

  const categories = useMemo(() => getProductCategories(allProducts), [allProducts]);
  const subcategories = useMemo(
    () => getProductSubcategories(
      allProducts.filter((product) =>
        selectedCategories.length === 0 ||
        selectedCategories.some((name) =>
          getProductCategory(product).toLocaleLowerCase() === name.toLocaleLowerCase()
        )
      ),
      ""
    ),
    [allProducts, categoryFilterKey]
  );
  const filtered = useMemo(() => products.filter((product) => {
    const category = getProductCategory(product).toLocaleLowerCase();
    const subcategory = getProductSubcategory(product).toLocaleLowerCase();
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((name) => category === name.toLocaleLowerCase());
    const matchesSubcategory =
      selectedSubcategories.length === 0 ||
      selectedSubcategories.some((name) => subcategory === name.toLocaleLowerCase());
    const productName = String(
      product.productName ??
      product.ProductsName ??
      product.ProductName ??
      product.title ??
      product.Title ??
      ""
    ).toLocaleLowerCase();
    return matchesCategory && matchesSubcategory && (!searchQuery || productName.includes(searchQuery));
  }), [products, categoryFilterKey, subcategoryFilterKey, searchQuery]);

  const updateFilters = (key, value) => {
    const next = new URLSearchParams(location.search);
    const values = selectedValues(params, key);
    const nextValues = values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];

    next.delete(key);
    nextValues.forEach((item) => next.append(key, item));
    if (key === "category") next.delete("subcategory");
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next}` : "" });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (params.has("q")) next.set("q", params.get("q"));
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next}` : "" });
  };

  const categoryCount = (category) => allProducts.filter(
    (product) => getProductCategory(product).toLocaleLowerCase() === category.toLocaleLowerCase()
  ).length;
  const subcategoryCount = (subcategory) => allProducts.filter((product) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((name) => getProductCategory(product).toLocaleLowerCase() === name.toLocaleLowerCase());
    return matchesCategory &&
      getProductSubcategory(product).toLocaleLowerCase() === subcategory.toLocaleLowerCase();
  }).length;

  const heading = selectedSubcategories.join(", ") || selectedCategories.join(", ") || "All products";

  return (
    <main className="catalog-page">
      <h1 className="catalog-heading">{heading}</h1>
      <div className="catalog-layout">
        <aside className="catalog-sidebar" aria-label="Product filters">
          <div className="catalog-filter-heading">
            <h2>Filters</h2>
            {(selectedCategories.length > 0 || selectedSubcategories.length > 0) && (
              <button type="button" onClick={clearFilters}>Clear</button>
            )}
          </div>
          <fieldset className="catalog-filter-group">
            <legend>Category</legend>
            {categories.map((category) => (
              <label key={category} className="catalog-check-option">
                <input
                  type="checkbox"
                  checked={selectedCategories.some((name) => name.toLocaleLowerCase() === category.toLocaleLowerCase())}
                  onChange={() => updateFilters("category", category)}
                />
                <span>{category}</span>
                <small>{categoryCount(category)}</small>
              </label>
            ))}
          </fieldset>
          {subcategories.length > 0 && (
            <fieldset className="catalog-filter-group">
              <legend>Subcategory</legend>
              {subcategories.map((subcategory) => (
                <label key={subcategory} className="catalog-check-option">
                  <input
                    type="checkbox"
                    checked={selectedSubcategories.some((name) => name.toLocaleLowerCase() === subcategory.toLocaleLowerCase())}
                    onChange={() => updateFilters("subcategory", subcategory)}
                  />
                  <span>{subcategory}</span>
                  <small>{subcategoryCount(subcategory)}</small>
                </label>
              ))}
            </fieldset>
          )}
        </aside>

        <section className="catalog-results" aria-label="Product results">
          <p className="catalog-result-count">
            {loading ? "Loading products…" : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
          </p>
          {loading ? (
            <div className="catalog-state" role="status">Loading products…</div>
          ) : loadError ? (
            <div className="catalog-state" role="alert">{loadError}</div>
          ) : filtered.length === 0 ? (
            <div className="catalog-state">No products match these filters.</div>
          ) : (
            <div className="product-grid">
              {filtered.map((product, index) => (
                <ProductCard key={product.id ?? product.Id ?? product.productId ?? index} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ProductList;

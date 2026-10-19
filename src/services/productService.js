import env from "../config/env";
import publicApiClient from "./publicapiClient";

let productsRequest;

function getPayload(response) {
  let payload = response?.data ?? response;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) break;
    if (payload.success === false || payload.Success === false) {
      throw new Error(payload.message ?? payload.Message ?? "The product API request failed.");
    }
    const nested = payload.data ?? payload.Data;
    if (nested === undefined || nested === payload) break;
    payload = nested;
  }
  return payload;
}

function resolveImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const rawPath = value.trim();
  const diskPath = rawPath.match(/^[a-z]:[\\/]+ProductImages[\\/]+(.+)$/i);
  const path = diskPath
    ? `/ProductImages/${diskPath[1].split(/[\\/]/).map(encodeURIComponent).join("/")}`
    : rawPath.replace(/\\/g, "/");
  try {
    const imageUrl = new URL(path, `${new URL(env.DIGITAL_API_URL).origin}/`);
    if (/\/(?:product)?images\/?$/i.test(imageUrl.pathname)) return "";
    return imageUrl.toString();
  } catch {
    return path;
  }
}

function imageValues(value) {
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
}

function imageUrlOf(image) {
  if (typeof image === "string") return resolveImageUrl(image);
  return resolveImageUrl(
    image?.ImagesPath ??
    image?.imagesPath ??
    image?.ImageUrl ??
    image?.imageUrl ??
    image?.Url ??
    image?.url
  );
}

function catalogName(value) {
  if (typeof value === "string") return value.trim();
  return String(
    value?.categoryName ??
    value?.CategoryName ??
    value?.subCategoryName ??
    value?.SubCategoryName ??
    value?.name ??
    value?.Name ??
    ""
  ).trim();
}

function normalizeProduct(product) {
  const imageSources = [
    product.ImageUrls,
    product.imageUrls,
    product.ProductImages,
    product.productImages,
    product.Images,
    product.images,
  ];
  let imageUrls = [];
  for (const source of imageSources) {
    imageUrls = imageValues(source).map(imageUrlOf).filter(Boolean);
    if (imageUrls.length) break;
  }
  const primaryImage = resolveImageUrl(
    product.Imageurl ??
    product.ImageUrl ??
    product.imageUrl ??
    product.imageurl ??
    product.image
  );
  if (primaryImage && !imageUrls.includes(primaryImage)) imageUrls.unshift(primaryImage);

  return {
    ...product,
    id: product.id ?? product.Id ?? product.productId ?? product.ProductId,
    productName:
      product.productName ??
      product.ProductName ??
      product.ProductsName ??
      product.Title ??
      product.title ??
      "",
    category: catalogName(product.category ?? product.Category),
    subCategory: catalogName(
      product.subCategory ??
      product.SubCategory ??
      product.subcategory ??
      product.Subcategory
    ),
    price: product.price ?? product.Price ?? 0,
    longDescription: product.longDescription ?? product.LongDescription ?? "",
    imageUrls,
    images: imageUrls,
    image: imageUrls[0] ?? "",
  };
}

function normalizeProductRows(response) {
  const payload = getPayload(response);
  const rows = Array.isArray(payload)
    ? payload
    : payload?.items ?? payload?.Items;
  if (!Array.isArray(rows)) {
    throw new Error("The product catalogue returned an invalid response.");
  }
  return rows.map(normalizeProduct);
}

export const getProductCategory = (product) =>
  String(product.category ?? product.Category ?? "").trim();

export const getProductSubcategory = (product) =>
  String(
    product.subCategory ??
    product.SubCategory ??
    product.subcategory ??
    product.Subcategory ??
    ""
  ).trim();

export function getProductCategories(products) {
  return [...new Set(products.map(getProductCategory).filter(Boolean))];
}

export function getProductSubcategories(products, category = "") {
  const selectedCategory = category.trim().toLocaleLowerCase();
  return [
    ...new Set(
      products
        .filter((product) =>
          !selectedCategory ||
          getProductCategory(product).toLocaleLowerCase() === selectedCategory
        )
        .map(getProductSubcategory)
        .filter(Boolean)
    ),
  ];
}

const productService = {
  async getProducts(filters = {}) {
    const categories = Array.isArray(filters.categories) ? filters.categories.filter(Boolean) : [];
    const subcategories = Array.isArray(filters.subcategories) ? filters.subcategories.filter(Boolean) : [];
    if (categories.length || subcategories.length) {
      const response = await publicApiClient.get("/product/GetAll", {
        params: {
          ...(categories.length ? { category: categories.join(",") } : {}),
          ...(subcategories.length ? { subCategory: subcategories.join(",") } : {}),
        },
      });
      return normalizeProductRows(response);
    }

    if (!productsRequest) {
      productsRequest = publicApiClient.get("/product/GetAll")
        .then(normalizeProductRows)
        .catch((error) => {
          productsRequest = null;
          throw error;
        });
    }
    return productsRequest;
  },

  async getProduct(id) {
    const responseProduct = getPayload(
      await publicApiClient.get(`/product/GetbyProductid/${encodeURIComponent(id)}`)
    );
    if (!responseProduct || typeof responseProduct !== "object" || Array.isArray(responseProduct)) {
      throw new Error("The product detail API returned an invalid response.");
    }
    const product = normalizeProduct(responseProduct);
    if (product.imageUrls.length) return product;

    // The current detail endpoint only returns Imageurl (sometimes just the
    // image directory); the catalogue endpoint includes the product's images.
    const catalogueProduct = (await this.getProducts()).find(
      (item) => String(item.id) === String(product.id ?? id)
    );
    if (!catalogueProduct?.imageUrls?.length) return product;

    return {
      ...product,
      imageUrls: catalogueProduct.imageUrls,
      images: catalogueProduct.imageUrls,
      image: catalogueProduct.imageUrls[0],
      imageurl: catalogueProduct.imageUrls[0],
    };
  },
};

export default productService;

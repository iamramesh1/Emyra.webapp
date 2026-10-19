import { digitalApi } from "./apiInstances";

function getPayload(response) {
  const body = response?.data && typeof response.data === "object" && !Array.isArray(response.data)
    ? response.data
    : response;
  if (body?.success === false || body?.Success === false) {
    throw new Error(body.message ?? body.Message ?? "The category API request failed.");
  }
  return body?.data ?? body?.Data ?? body;
}

function getRows(response) {
  const payload = getPayload(response);
  const rows = payload?.items ?? payload?.Items ?? payload;
  if (!Array.isArray(rows)) {
    throw new Error("The category API returned an invalid response.");
  }
  return rows;
}

const categoryService = {
  async getCategories() {
    return getRows(await digitalApi.get("/Category/GetAllAdmin"));
  },

  async createCategory(category) {
    return getPayload(await digitalApi.post("/Category/Create", category));
  },

  async updateCategory(id, category) {
    return getPayload(await digitalApi.put(`/Category/Update/${id}`, category));
  },

  async deleteCategory(id) {
    return getPayload(await digitalApi.delete(`/Category/Delete/${id}`));
  },

  async createSubCategory(subCategory) {
    return getPayload(await digitalApi.post("/SubCategory/Create", subCategory));
  },

  async updateSubCategory(id, subCategory) {
    return getPayload(await digitalApi.put(`/SubCategory/Update/${id}`, subCategory));
  },

  async deleteSubCategory(id) {
    return getPayload(await digitalApi.delete(`/SubCategory/Delete/${id}`));
  },
};

export default categoryService;

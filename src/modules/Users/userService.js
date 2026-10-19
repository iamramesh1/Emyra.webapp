import { userApi } from "../../services/apiInstances";
import API_ENDPOINTS from "../../config/apiEndpoints";

function getPayload(response) {
  let payload = response;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) break;
    if (payload.success === false || payload.Success === false) {
      const details = payload.errors ?? payload.Errors;
      const message = payload.message ?? payload.Message;
      const errorDetails = Array.isArray(details)
        ? details.filter(Boolean).join("; ")
        : details;
      throw new Error([message, errorDetails].filter(Boolean).join(": ") || "The user API request failed.");
    }
    const nested = payload.data ?? payload.Data;
    if (nested === undefined || nested === payload) break;
    payload = nested;
  }
  return payload;
}

function getRows(response, resourceName) {
  const payload = getPayload(response);
  const rows = Array.isArray(payload)
    ? payload
    : payload?.items ?? payload?.Items;
  if (!Array.isArray(rows)) {
    throw new Error(`The ${resourceName} API returned an invalid response.`);
  }
  return rows;
}

const userService = {
  async getUsers() {
    return getRows(await userApi.get(API_ENDPOINTS.USERS.GET_ALL), "users");
  },

  async createUser(user) {
    return getPayload(await userApi.post(API_ENDPOINTS.USERS.CREATE, user));
  },

  async updateUser(id, user) {
    return getPayload(await userApi.put(`${API_ENDPOINTS.USERS.UPDATE}/${id}`, user));
  },

  async deleteUser(id) {
    return getPayload(await userApi.delete(`${API_ENDPOINTS.USERS.DELETE}/${id}`));
  },

  async getRoles() {
    return getRows(await userApi.get(API_ENDPOINTS.ROLES.GET_ALL), "roles");
  },

  async createRole(role) {
    return getPayload(await userApi.post(API_ENDPOINTS.ROLES.CREATE, role));
  },

  async updateRole(role) {
    return getPayload(await userApi.put(API_ENDPOINTS.ROLES.UPDATE, role));
  },

  async deleteRole(id) {
    return getPayload(await userApi.delete(`${API_ENDPOINTS.ROLES.DELETE}/${id}`));
  },
};

export default userService;

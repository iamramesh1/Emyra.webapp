import { userApi as apiClient } from "./apiInstances";

class BaseService {

  constructor(endpoint) {

    this.endpoint = endpoint;
  }

  // GET ALL

  async getAll(params = {}) {

    return await apiClient.get(
      this.endpoint,
      { params }
    );
  }

  // GET BY ID

  async getById(id) {

    return await apiClient.get(
      `${this.endpoint}/${id}`
    );
  }

  // CREATE

  async create(data) {

    return await apiClient.post(
      this.endpoint,
      data
    );
  }

  // UPDATE

  async update(id, data) {

    return await apiClient.put(
      `${this.endpoint}/${id}`,
      data
    );
  }

  // DELETE

  async delete(id) {

    return await apiClient.delete(
      `${this.endpoint}/${id}`
    );
  }

  // CUSTOM POST

  async post(url, data) {

    return await apiClient.post(
      `${this.endpoint}/${url}`,
      data
    );
  }

  // CUSTOM GET

  async customGet(url) {

    return await apiClient.get(
      `${this.endpoint}/${url}`
    );
  }
}

export default BaseService;
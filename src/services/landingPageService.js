// src/services/landingPageService.js
// Use the SAME axios instance that productService.js uses (baseURL should end with /api).
//import api from "./api";
import { digitalApi as api } from "./apiInstances";

const BASE = "/LandingPage";
const unwrap = (res) => res.data?.data ?? res.data;
const multipart = { headers: { "Content-Type": "multipart/form-data" } };

async function upload(path, file) {
  const form = new FormData();
  form.append("file", file);
  const data = unwrap(await api.post(path, form, multipart));
  return data?.url ?? data?.Url;
}

const landingPageService = {
  // ---------- admin ----------
  async getAll() {
    const data = unwrap(await api.get(`${BASE}/GetAll`));
    return Array.isArray(data) ? data : [];
  },
  async getById(id) {
    return unwrap(await api.get(`${BASE}/${id}`));
  },
  async create(payload) {
    return unwrap(await api.post(`${BASE}/Create`, payload));
  },
  async update(id, payload) {
    return unwrap(await api.put(`${BASE}/${id}`, payload));
  },
  async delete(id) {
    return unwrap(await api.delete(`${BASE}/${id}`));
  },
  // slide images, gallery images and product video (admin only)
  uploadMedia(file) {
    return upload(`${BASE}/UploadMedia/media/uploadfile`, file);
  },

  // ---------- public ----------
  async getPublished(slug) {
    return unwrap(await api.get(`${BASE}/GetBySlug/public/${encodeURIComponent(slug)}`));
  },
  // customer review images / video (anonymous)
  uploadReviewMedia(file) {
    return upload(`${BASE}//UploadReviewMedia/media/review-upload`, file);
  },
  async addReview(slug, payload) {
    return unwrap(await api.post(`${BASE}/public/${encodeURIComponent(slug)}/reviews`, payload));
  },
};

export default landingPageService;

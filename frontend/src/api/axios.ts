import axios from "axios";

const env = (import.meta as ImportMeta & {
  env: { MODE: string; VITE_API_URL?: string; VITE_API_BASE_URL?: string };
}).env;

// Do not force `/api` globally; some deployments use `/v1/*`.
export const API_BASE_URL =
  env.VITE_API_URL?.trim() ||
  env.VITE_API_BASE_URL?.trim() ||
  // In production we default to same-origin so Nginx/ALB can proxy `/auth/*`, `/api/*`, `/v1/*` to the backend.
  (env.MODE === "production" ? "/" : "http://localhost:4000");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

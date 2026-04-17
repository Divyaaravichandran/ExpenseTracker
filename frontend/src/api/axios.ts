import axios from "axios";

const env = (import.meta as ImportMeta & {
  env: { VITE_API_URL?: string; VITE_API_BASE_URL?: string };
}).env;

export const API_BASE_URL =
  env.VITE_API_URL || env.VITE_API_BASE_URL || "http://18.209.216.82:4000";

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

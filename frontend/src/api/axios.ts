import axios from "axios";

const baseURL = (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL,
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
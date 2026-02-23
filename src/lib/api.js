// src/lib/api.js
import axios from "axios";

/**
 * ✅ Base backend URL
 * - In Render / production set: VITE_API_URL=https://premium-bank-backend.onrender.com
 *   (WITHOUT /api)
 * - Locally you can set: VITE_API_URL=http://localhost:5000
 */
const RAW_BASE =
  import.meta.env.VITE_API_URL || "https://premium-bank-backend.onrender.com";

// ✅ Ensure exactly ONE /api at the end of baseURL
const baseURL = RAW_BASE.replace(/\/+$/, "").replace(/\/api$/, "") + "/api";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

/**
 * ✅ Automatically attach JWT token
 * - Don't attach token to /auth routes
 */
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const url = config.url || "";
  const isAuthRoute = url.startsWith("/auth");

  config.headers = config.headers || {};

  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
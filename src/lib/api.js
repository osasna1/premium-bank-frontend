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
  // ✅ Render can "cold start" after idle; allow enough time
  timeout: 60000, // 60 seconds
});

/**
 * ✅ Automatically attach JWT token
 * - Don't attach token to /auth routes
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const url = config.url || "";
  const isAuthRoute = url.startsWith("/auth");

  config.headers = config.headers || {};

  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * ✅ Simple retry for cold-start timeouts/network errors
 * - Retries ONLY for timeout/network (not for wrong password, 400, 401, etc.)
 */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config || {};

    // how many retries you want
    config.__retryCount = config.__retryCount || 0;

    const isTimeout = error.code === "ECONNABORTED";
    const isNetwork = !error.response; // no response at all

    // retry only 2 times for timeout/network
    if ((isTimeout || isNetwork) && config.__retryCount < 2) {
      config.__retryCount += 1;

      // wait 1.5s then retry
      await new Promise((r) => setTimeout(r, 1500));
      return api(config);
    }

    return Promise.reject(error);
  }
);
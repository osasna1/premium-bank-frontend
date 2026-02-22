import axios from "axios";

/*
  ✅ Use deployed backend first
  Replace with your Render backend URL
*/
const baseURL =
  import.meta.env.VITE_API_URL ||
  "https://premium-bank-backend.onrender.com/api";

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

/*
  ✅ Automatically attach JWT token
*/
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  config.headers = config.headers || {};

  const url = config.url || "";
  const isAuthRoute = url.startsWith("/auth");

  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
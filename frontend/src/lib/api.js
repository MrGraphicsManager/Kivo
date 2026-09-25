import axios from "axios";

// Ensure the app always talks to the live serverless API (works universally on Vercel, Netlify, and custom domain)
const rawEnvUrl = (process.env.REACT_APP_BACKEND_URL || "").trim();
const isLegacyRender = rawEnvUrl.includes("onrender.com");
const BASE = (rawEnvUrl && !isLegacyRender) ? rawEnvUrl.replace(/\/$/, "") : "";
export const API_BASE = BASE ? `${BASE}/api` : "/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach token, shop ID, and cache-busting timestamps to avoid stale browser disk cache
api.interceptors.request.use((config) => {
  const shopId = localStorage.getItem("dukaan_shop_id");
  // Authentication is cookie-only. The access token is HttpOnly and never exposed to JavaScript.
  if (shopId) {
    config.headers["X-Shop-Id"] = shopId;
  }
   // Guarantee 100% fresh real-time responses by cache-busting all GET queries
  if (!config.method || config.method.toLowerCase() === "get") {
    config.params = {
      ...(config.params || {}),
      _t: Date.now()
    };
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
  }
  return config;
});

export function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default api;

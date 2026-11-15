import axios from "axios";

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const host = window.location.hostname;
    // When running in production (Vercel, Render, custom domains) without VITE_BACKEND_URL configured
    if (
      host.includes("vercel.app") ||
      host.includes("onrender.com") ||
      (!host.includes("localhost") && host !== "127.0.0.1")
    ) {
      return "https://new-project-1-sjgo.onrender.com";
    }
    return `http://${host}:5000`;
  }
  return "http://localhost:5000";
};

export const BACKEND_URL = getBaseUrl();

const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 15000,
});

// Simple in-memory client cache with TTL & request deduplication for read-only GET calls
const cacheStore = new Map();
const inFlightRequests = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

export const getCachedData = (key) => {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
};

export const setCachedData = (key, data, ttlMs = DEFAULT_TTL_MS) => {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
};

export const clearApiCache = (prefix) => {
  if (!prefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
};

// Cached GET helper with automatic request deduplication and SWR behavior
export const cachedGet = async (url, config = {}, ttlMs = DEFAULT_TTL_MS) => {
  const cacheKey = `${url}?${JSON.stringify(config.params || {})}`;

  // Return fresh cache immediately if available
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  // Deduplicate identical in-flight requests
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const reqPromise = API.get(url, config)
    .then((res) => {
      setCachedData(cacheKey, res, ttlMs);
      inFlightRequests.delete(cacheKey);
      return res;
    })
    .catch((err) => {
      inFlightRequests.delete(cacheKey);
      throw err;
    });

  inFlightRequests.set(cacheKey, reqPromise);
  return reqPromise;
};

// Automatically attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Clear cache on mutating operations (POST, PUT, DELETE, PATCH)
API.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    if (method && method !== "get") {
      clearApiCache();
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
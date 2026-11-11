import axios from "axios";

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

export const BACKEND_URL = getBaseUrl();

const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
});

// Automatically attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;

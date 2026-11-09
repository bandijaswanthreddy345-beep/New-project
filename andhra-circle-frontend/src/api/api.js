import axios from "axios";

const API = axios.create({
baseURL: `${import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`}/api`,
});

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

export default API;
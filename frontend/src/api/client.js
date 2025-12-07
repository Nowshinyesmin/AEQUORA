// frontend/src/api/client.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Attach Authorization header automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");     // frontend stores admin token under "token"
  if (token) {
    config.headers["Authorization"] = `Token ${token}`;
  }
  return config;
});


// --- THE FIX: Request Interceptor ---
// This runs before every single API request.
api.interceptors.request.use(
  (config) => {
    // 1. Look for the token in Local Storage
    const token = localStorage.getItem("token");

    // 2. If token exists, attach it to the headers
    // The format must be exactly: "Token <your-token-key>"
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
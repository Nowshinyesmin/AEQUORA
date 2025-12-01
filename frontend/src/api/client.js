// frontend/src/api/client.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
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
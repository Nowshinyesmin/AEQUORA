// frontend/src/api/client.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",  // Django backend base
  // withCredentials: true, // enable later if you use cookies/session auth
});

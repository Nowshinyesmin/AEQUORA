// frontend/src/main.jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

// Pages
import HomePage from "./pages/Home/Index.jsx";
// later you can add your other pages here, for example:
// import Login from "./pages/Login/Login.jsx";
// import Register from "./pages/Register/Register.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* HOME */}
        <Route path="/" element={<HomePage />} />

        {/* uncomment / add more when those files exist */}
        {/* <Route path="/login" element={<Login />} /> */}
        {/* <Route path="/register" element={<Register />} /> */}
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

// frontend/src/main.jsx


import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Global Styles
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

// --- Pages ---
import HomePage from "./pages/Home/Index.jsx";
import Login from "./pages/LoginPage/LoginPage.jsx";
import Register from "./pages/RegistrationPage/RegistrationPage.jsx";

// Authority Page
import AuthorityDashboard from "./pages/AuthorityDashboard/AuthorityDashboard.jsx";
import ManageIssues from "./pages/ManageIssues/ManageIssues.jsx";
import AnalyticsReports from "./pages/AnalyticsReports/AnalyticsReports.jsx";
import EventsRequests from "./pages/EventsRequests/EventsRequests.jsx";
import CommunityVoting from "./pages/CommunityVoting/CommunityVoting.jsx";



// Resident Pages
import ResidentDashboard from "./pages/ResidentDashboard/ResidentDashboard.jsx";
import IssueReports from "./pages/IssueReports/IssueReports.jsx";
import BookService from "./pages/BookService/BookService.jsx";
import CommunityEvents from "./pages/CommunityEvents/CommunityEvents.jsx";
import EmergencySOS from "./pages/EmergencySOS/EmergencySOS.jsx";
import ResidentProfileSettings from "./pages/ResidentProfileSettings/ResidentProfileSettings.jsx";
import AuthorityEmergency from "./pages/AuthorityEmergency/AuthorityEmergency.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        {/* Authority Routes */}
        <Route path="/authority/dashboard" element={<AuthorityDashboard />} />
        <Route path="/authority/manage-issues" element={<ManageIssues />} />
        <Route path="/authority/analytics" element={<AnalyticsReports />} />
        <Route path="/authority/events" element={<EventsRequests />} />
        <Route path="/authority/voting" element={<CommunityVoting />} />
        <Route path="/authority/emergency" element={<AuthorityEmergency />} />



        {/* Resident Routes */}
        <Route path="/resident/dashboard" element={<ResidentDashboard />} />
        <Route path="/report-issue" element={<IssueReports />} />
        <Route path="/book-service" element={<BookService />} />
        <Route path="/events" element={<CommunityEvents />} />
        <Route path="/sos" element={<EmergencySOS />} />
        <Route path="/profile" element={<ResidentProfileSettings />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
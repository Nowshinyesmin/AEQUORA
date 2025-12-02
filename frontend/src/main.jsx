// frontend/src/main.jsx


import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Global Styles
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

// --- Public Pages ---
import HomePage from "./pages/Home/Index";
import Login from "./pages/LoginPage/LoginPage";
import Register from "./pages/RegistrationPage/RegistrationPage";

// --- Resident Pages (Existing Imports) ---
// NOTE: Removed .jsx extension to prevent import conflicts
//import ResidentDashboard from "./pages/ResidentDashboard/ResidentDashboard";
//import IssueReports from "./pages/IssueReports/IssueReports";
//import BookService from "./pages/BookService/BookService";
//import CommunityEvents from "./pages/CommunityEvents/CommunityEvents";
//import EmergencySOS from "./pages/EmergencySOS/EmergencySOS";
//import ResidentProfileSettings from "./pages/ResidentProfileSettings/ResidentProfileSettings";

// --- Service Provider Pages (NEW Imports - Fix applied by removing .jsx) ---
import ServiceProviderDashboard from "./pages/ServiceProviderDashboard/ServiceProviderDashboard"; 
import ManageBookings from "./pages/ManageBookings/ManageBookings";
import ManageServices from "./pages/ManageServices/ManageServices";
import CustomerReviews from "./pages/CustomerReviews/CustomerReviews";
import ServiceProviderProfileSettings from "./pages/ServiceProviderProfileSettings/ServiceProviderProfileSettings"; 

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

        {/* --- Service Provider Routes (NEW Routes) --- */}
        <Route 
          path="/serviceprovider/dashboard" 
          element={<ServiceProviderDashboard />} 
        />
        <Route 
          path="/serviceprovider/bookings" 
          element={<ManageBookings />} 
        />
        <Route 
          path="/serviceprovider/services" 
          element={<ManageServices />} 
        />
        <Route 
          path="/serviceprovider/reviews" 
          element={<CustomerReviews />} 
        />
        <Route 
          path="/serviceprovider/profile" 
          element={<ServiceProviderProfileSettings />} 
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

// Note: This file is now minimal and focuses only on routing structure.
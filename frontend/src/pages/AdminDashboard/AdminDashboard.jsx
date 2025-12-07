// frontend/src/pages/AdminDashboard/AdminDashboard.jsx

import React from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  LogOut,
  Activity,
} from "lucide-react";
import { Container } from "react-bootstrap";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/admin/profile");
  };

  return (
    <div className="dashboard-root">
      {/* Sidebar (same structure as Resident) */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">Aequora</div>

        <div className="user-profile-section">
          <div className="user-name-display">Admin User</div>
          <div className="user-role-display">Admin</div>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard */}
          <Link to="/AdminDashboard" className="nav-link-custom active">
            <LayoutDashboard size={20} className="nav-icon" />
            Dashboard
          </Link>

          {/* Add Community */}
          <Link to="/admin/add-community" className="nav-link-custom">
            <Building2 size={20} className="nav-icon" />
            Add Community
          </Link>

          {/* Manage Community */}
          <Link to="/admin/communities" className="nav-link-custom">
            <ClipboardList size={20} className="nav-icon" />
            Manage Community
          </Link>

          {/* Manage Users */}
          <Link to="/admin/users" className="nav-link-custom">
            <Users size={20} className="nav-icon" />
            Manage Users
          </Link>

          {/* Profile */}
          <button className="nav-link-custom" onClick={goToProfile}>
            <Users size={20} className="nav-icon" />
            Profile
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} className="me-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        {/* Top-right profile icon */}
        <div className="header-right-actions">
          <button className="admin-profile-circle" onClick={goToProfile}>
            Admin
          </button>
        </div>

        <Container fluid className="p-0">
          <div className="page-header-mb">
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">
              Welcome back! Here's what's happening across your communities.
            </p>
          </div>

          {/* Stats row – 3 cards side by side */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Total Communities</span>
                <Building2 size={22} className="text-primary" />
              </div>
              <div className="stat-value">0</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Total Users</span>
                <Users size={22} className="text-success" />
              </div>
              <div className="stat-value">0</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Pending Requests</span>
                <ClipboardList size={22} className="text-warning" />
              </div>
              <div className="stat-value">0</div>
            </div>
          </div>

          {/* Recent activity section */}
          <div className="activity-section-card">
            <div className="activity-header">
              <Activity size={20} className="me-2" />
              Recent Activities
            </div>

            <div className="empty-activity-state">
              No recent activities. Start by adding a community or reviewing
              community requests!
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}

export default AdminDashboard;

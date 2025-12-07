// frontend/src/pages/AdminProfile/AdminProfile.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  LogOut,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { Row, Col, Form, Button } from "react-bootstrap";
import "./AdminProfile.css";

function AdminProfile() {
  const navigate = useNavigate();

  // dummy local state – later you can fill from backend
  const [profile, setProfile] = useState({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
});


  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goToProfile = () => {
    // already on profile, but keeps the header/profile circle behaviour
    navigate("/admin/profile");
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    // later call your backend here with api.put(...)
    console.log("Save profile", profile);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    // later call your backend here with api.post(...)
    console.log("Update password", passwords);
  };

  return (
    <div className="dashboard-root">
      {/* ----- SIDEBAR ----- */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">Aequora</div>

        <div className="user-profile-section">
          <div className="user-name-display">Admin User</div>
          <div className="user-role-display">Admin</div>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard */}
          <Link to="/AdminDashboard" className="nav-link-custom">
            <LayoutDashboard size={20} className="nav-icon" />
            Dashboard
          </Link>

          {/* Add Community */}
          <Link to="/admin/add-community" className="nav-link-custom">
            <Building2 size={20} className="nav-icon" />
            Add Community
          </Link>

          {/* Manage Communities */}
          <Link to="/admin/communities" className="nav-link-custom">
            <ClipboardList size={20} className="nav-icon" />
            Manage Communities
          </Link>

          {/* Manage Users */}
          <Link to="/admin/users" className="nav-link-custom">
            <Users size={20} className="nav-icon" />
            Manage Users
          </Link>

          {/* Profile (ACTIVE) */}
          <button className="nav-link-custom active" onClick={goToProfile}>
            <UserIcon size={20} className="nav-icon" />
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

      {/* ----- MAIN CONTENT ----- */}
      <main className="dashboard-main">
        {/* top right profile circle */}
        <div className="header-right-actions">
          <button className="admin-profile-circle" onClick={goToProfile}>
            Admin
          </button>
        </div>

        <div className="page-header-mb">
          <h1 className="page-title">Admin Profile</h1>
          <p className="page-subtitle">
            Manage your account information and update your password.
          </p>
        </div>

        <Row className="g-4">
          {/* PERSONAL INFO */}
          <Col md={7}>
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-card-title-wrap">
                  <UserIcon size={20} className="me-2" />
                  <span>Personal Information</span>
                </div>
                <span className="profile-card-caption">
                  These details identify your admin account.
                </span>
              </div>

              <Form onSubmit={handleSaveProfile}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="firstName">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleProfileChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="lastName">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleProfileChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="email">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="phone">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={profile.phone}
                        onChange={handleProfileChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="dob">
                      <Form.Label>Date of Birth</Form.Label>
                      <Form.Control
                        type="date"
                        name="dob"
                        value={profile.dob}
                        onChange={handleProfileChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="gender">
                      <Form.Label>Gender</Form.Label>
                      <Form.Select
                        name="gender"
                        value={profile.gender}
                        onChange={handleProfileChange}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="profile-actions">
                  <Button type="submit" className="btn-primary-rounded">
                    Save Changes
                  </Button>
                </div>
              </Form>
            </div>
          </Col>

          {/* SECURITY / PASSWORD */}
          <Col md={5}>
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-card-title-wrap">
                  <Shield size={20} className="me-2" />
                  <span>Security</span>
                </div>
                <span className="profile-card-caption">
                  Update your password regularly to keep your account secure.
                </span>
              </div>

              <Form onSubmit={handleUpdatePassword}>
                <Form.Group className="mb-3" controlId="currentPassword">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="newPassword">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="confirmPassword">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </Form.Group>

                <div className="profile-actions">
                  <Button type="submit" className="btn-outline-rounded">
                    Update Password
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </main>
    </div>
  );
}

export default AdminProfile;

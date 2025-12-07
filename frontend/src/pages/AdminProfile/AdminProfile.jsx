// frontend/src/pages/AdminProfile/AdminProfile.jsx

import React, { useState, useEffect } from "react";
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
import { Row, Col, Form, Button, Alert } from "react-bootstrap";
import "./AdminProfile.css";
import { api } from "../../api/client";

function AdminProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "Male",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ----------------- LOAD PROFILE FROM BACKEND -----------------
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        setError("");
        const res = await api.get("/admin/profile/");
        const data = res.data || {};

        setProfile({
          firstName: data.first_name || "Admin",
          lastName: data.last_name || "User",
          email: data.email || "aequora@gmail.com",
          phone: data.phone || "",
          dob: data.dob || "",
          gender: data.gender || "Male",
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load admin profile.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goToProfile = () => {
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

  // ----------------- SAVE PROFILE -----------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSavingProfile(true);
      await api.put("/admin/profile/", {
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        dob: profile.dob,
        gender: profile.gender,
        // email is hardcoded for login, so we don't send it to change
      });

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error || "Failed to update profile. Try again.";
      setError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // ----------------- UPDATE PASSWORD -----------------
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setUpdatingPassword(true);
      await api.post("/admin/change-password/", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });

      setSuccess("Password updated successfully.");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        "Failed to update password. Please check your current password.";
      setError(msg);
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="dashboard-root">
      {/* ----- SIDEBAR ----- */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">Aequora</div>

        <div className="user-profile-section">
          <div className="user-name-display">
            {profile.firstName || "Admin"} {profile.lastName || "User"}
          </div>
          <div className="user-role-display">Admin</div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/AdminDashboard" className="nav-link-custom">
            <LayoutDashboard size={20} className="nav-icon" />
            Dashboard
          </Link>

          <Link to="/admin/add-community" className="nav-link-custom">
            <Building2 size={20} className="nav-icon" />
            Add Community
          </Link>

          <Link to="/admin/communities" className="nav-link-custom">
            <ClipboardList size={20} className="nav-icon" />
            Manage Communities
          </Link>

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

        {/* alerts */}
        {error && (
          <div className="mb-3">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mb-3">
            <Alert variant="success">{success}</Alert>
          </div>
        )}

        {/* PROFILE SECTIONS */}
        <Row className="g-4">
          {/* PERSONAL INFO – full width, on top */}
          <Col xs={12}>
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
                        disabled={loadingProfile}
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
                        disabled={loadingProfile}
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
                        readOnly // login email is fixed
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
                        disabled={loadingProfile}
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
                        disabled={loadingProfile}
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
                        disabled={loadingProfile}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="profile-actions">
                  <Button
                    type="submit"
                    className="btn-primary-rounded"
                    disabled={savingProfile || loadingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </Form>
            </div>
          </Col>

          {/* SECURITY / PASSWORD – full width, below personal info */}
          <Col xs={12}>
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
                  <Button
                    type="submit"
                    className="btn-outline-rounded"
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? "Updating..." : "Update Password"}
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

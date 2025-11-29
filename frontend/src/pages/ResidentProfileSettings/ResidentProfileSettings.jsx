// frontend/src/pages/ResidentProfileSettings/ResidentProfileSettings.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  AlertCircle, 
  Briefcase, 
  Calendar, 
  Bell, 
  LogOut,
  User, 
  Camera, 
  MapPin, 
  Users, 
  Shield,
  Save
} from "lucide-react";
import "./ResidentProfileSettings.css";
import { api } from "../../api/client"; 

// --- Internal Sidebar Component ---
const Sidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ firstName: 'Resident', lastName: '', role: 'Resident' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await api.get('auth/users/me/');
        setUserInfo({
          firstName: response.data.first_name || '',
          lastName: response.data.last_name || '',
          role: 'Resident'
        });
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getDisplayName = () => `${userInfo.firstName} ${userInfo.lastName}`;

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">Aequora</div>

      <div className="user-profile-section">
        <div className="user-name-display">
          {loading ? '...' : getDisplayName()}
        </div>
        <div className="user-role-display">
          {userInfo.role}
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/resident/dashboard" className="nav-link-custom">
          <LayoutDashboard size={20} className="nav-icon" />
          Dashboard
        </Link>
        <Link to="/report-issue" className="nav-link-custom">
          <AlertCircle size={20} className="nav-icon" />
          Report Issue
        </Link>
        <Link to="/book-service" className="nav-link-custom">
          <Briefcase size={20} className="nav-icon" />
          Book Service
        </Link>
        <Link to="/events" className="nav-link-custom">
          <Calendar size={20} className="nav-icon" />
          Events
        </Link>
        <Link to="/sos" className="nav-link-custom">
          <Bell size={20} className="nav-icon" />
          Emergency SOS
        </Link>
        
        {/* Active State for Profile */}
        <Link to="/profile" className="nav-link-custom active">
          <User size={20} className="nav-icon" />
          Profile
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} className="me-2" />
          Logout
        </button>
      </div>
    </aside>
  );
};

// --- Main Page Component ---
const ResidentProfileSettings = () => {
  return (
    <div className="dashboard-container">
      {/* Sidebar Section */}
      <Sidebar />

      {/* Main Content Section */}
      <main className="main-content">
        
        {/* Header */}
        <div className="page-header">
          <div className="page-title">
            <h1>Profile Settings</h1>
            <div className="page-subtitle">Manage your personal information and preferences</div>
          </div>
        </div>

        {/* --- 1. Profile Picture Card --- */}
        <div className="settings-card">
          <div className="card-header-row">
            <Camera size={20} />
            <span className="card-title-text">Profile Picture</span>
          </div>
          <p className="card-description">Upload a profile picture</p>

          <div className="profile-upload-area">
            <div className="avatar-placeholder">
              <User size={32} />
            </div>
            <div className="upload-controls">
              <button className="btn-upload">
                <Camera size={16} className="me-2" />
                Upload Photo
              </button>
              <span className="upload-hint">JPG, PNG or GIF (max 2MB)</span>
            </div>
          </div>
        </div>

        {/* --- 2. Personal Information Card --- */}
        <div className="settings-card">
          <div className="card-header-row">
            <User size={20} />
            <span className="card-title-text">Personal Information</span>
          </div>
          <p className="card-description">Update your basic details</p>

          <form>
            <div className="form-row-grid">
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" className="form-control-settings" />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input type="text" className="form-control-settings" />
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" className="form-control-settings" />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select className="form-control-settings" defaultValue="">
                  <option value="" disabled>Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Emergency Contact</label>
              <input type="text" className="form-control-settings" placeholder="+880 1234567890" />
            </div>
          </form>
        </div>

        {/* --- 3. Address Information Card --- */}
        <div className="settings-card">
          <div className="card-header-row">
            <MapPin size={20} />
            <span className="card-title-text">Address Information</span>
          </div>
          <p className="card-description">Your residential address details</p>

          <div className="form-row-grid">
            <div className="form-group">
              <label>House No.</label>
              <input type="text" className="form-control-settings" placeholder="123" />
            </div>
            <div className="form-group">
              <label>Street</label>
              <input type="text" className="form-control-settings" placeholder="Main Street" />
            </div>
          </div>

          <div className="form-row-grid">
            <div className="form-group">
              <label>Thana</label>
              <input type="text" className="form-control-settings" placeholder="Gulshan" />
            </div>
            <div className="form-group">
              <label>District</label>
              <input type="text" className="form-control-settings" placeholder="Dhaka" />
            </div>
          </div>
        </div>

        {/* --- 4. Community Card --- */}
        <div className="settings-card">
          <div className="card-header-row">
            <Users size={20} />
            <span className="card-title-text">Community</span>
          </div>
          <p className="card-description">Join or change your community</p>

          <div className="form-group">
            <label>Select Community</label>
            <select className="form-control-settings" defaultValue="">
              <option value="" disabled>Choose a community</option>
              <option value="1">Green Valley</option>
              <option value="2">Urban Heights</option>
            </select>
          </div>
        </div>

        {/* --- 5. Security Settings Card --- */}
        <div className="settings-card">
          <div className="card-header-row">
            <Shield size={20} />
            <span className="card-title-text">Security Settings</span>
          </div>
          <p className="card-description">Two-factor authentication code</p>

          <div className="form-group">
            <label>2FA Code</label>
            <input type="text" className="form-control-settings" placeholder="Enter your 2FA code" />
            <small className="form-text-muted">This code will be used for additional security verification</small>
          </div>
        </div>

        {/* --- Footer Buttons --- */}
        <div className="form-actions">
          <button className="btn-cancel">Cancel</button>
          <button className="btn-save">
            <Save size={16} className="me-2" />
            Save Changes
          </button>
        </div>

      </main>
    </div>
  );
};

export default ResidentProfileSettings;
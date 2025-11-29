// frontend/src/pages/EmergencySOS/EmergencySOS.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  AlertCircle, 
  Briefcase, 
  Calendar, 
  Bell, 
  LogOut,
  Siren,
  User,
  TriangleAlert // Using this for the header icon
} from "lucide-react";
import "./EmergencySOS.css";
import { api } from "../../api/client"; 

// --- Internal Sidebar Component ---
const Sidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ firstName: 'Resident', lastName: '', role: 'Resident' });
  const [loading, setLoading] = useState(true);

  // Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await api.get('auth/users/me/');
        setUserInfo({
          firstName: response.data.first_name || 'A',
          lastName: response.data.last_name || 'A',
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
        
        {/* Active Class + Red styling */}
        <Link to="/sos" className="nav-link-custom text-danger-custom active">
          <Bell size={20} className="nav-icon" />
          Emergency SOS
        </Link>
        
        <Link to="/profile" className="nav-link-custom">
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
const EmergencySOS = () => {
  return (
    <div className="dashboard-container">
      {/* Sidebar Section */}
      <Sidebar />

      {/* Main Content Section */}
      <main className="main-content">
        
        {/* Centered Header with Icon */}
        <div className="sos-page-header">
          <div className="header-icon-wrapper">
            <TriangleAlert size={40} strokeWidth={2.5} />
          </div>
          <h1 className="sos-title">Emergency SOS</h1>
          <p className="sos-subtitle">Report emergencies and get immediate assistance</p>
        </div>

        {/* Emergency Report Form Card */}
        <div className="emergency-card">
          <div className="emergency-card-header">
            <Bell size={20} />
            <span>Emergency Report Form</span>
          </div>
          
          <div className="emergency-card-body">
            <form>
              {/* Type */}
              <div className="form-group-custom">
                <label className="form-label-custom">Emergency Type *</label>
                <select className="form-control-custom" required defaultValue="">
                  <option value="" disabled>Select emergency type</option>
                  <option value="fire">Fire</option>
                  <option value="medical">Medical</option>
                  <option value="crime">Crime/Security</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Location */}
              <div className="form-group-custom">
                <label className="form-label-custom">Location *</label>
                <input 
                  type="text" 
                  className="form-control-custom" 
                  placeholder="Enter exact location"
                  required 
                />
                <small className="form-helper-text">
                  Provide as much detail as possible (building, floor, landmark)
                </small>
              </div>

              {/* Description */}
              <div className="form-group-custom">
                <label className="form-label-custom">Description</label>
                <textarea 
                  className="form-control-custom" 
                  rows={3}
                  placeholder="Describe the emergency situation..."
                ></textarea>
              </div>

              {/* Warning Box */}
              <div className="warning-box">
                <strong>Important:</strong> This will alert community authorities and emergency services immediately. Only use for genuine emergencies.
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn-emergency-submit">
                <Siren size={20} />
                Send Emergency SOS
              </button>
            </form>
          </div>
        </div>

        {/* Emergency Contacts Card */}
        <div className="contacts-card">
          <h3 className="contacts-title">Emergency Contacts</h3>
          
          <div className="contact-item">
            <div className="contact-info">
              <h5>Fire Service</h5>
              <p>24/7 Emergency</p>
            </div>
            <div className="contact-number">999</div>
          </div>

          <div className="contact-item">
            <div className="contact-info">
              <h5>Police</h5>
              <p>Emergency Line</p>
            </div>
            <div className="contact-number">999</div>
          </div>

          <div className="contact-item">
            <div className="contact-info">
              <h5>Ambulance</h5>
              <p>Medical Emergency</p>
            </div>
            <div className="contact-number">999</div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default EmergencySOS;
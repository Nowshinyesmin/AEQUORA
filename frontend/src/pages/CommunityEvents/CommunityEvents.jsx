// frontend/src/pages/CommunityEvents/CommunityEvents.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  AlertCircle, 
  Briefcase, 
  Calendar, 
  Bell, 
  LogOut,
  User // Added User icon
} from "lucide-react";
import "./CommunityEvents.css";
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
        
        {/* Active State Here */}
        <Link to="/events" className="nav-link-custom active">
          <Calendar size={20} className="nav-icon" />
          Events
        </Link>
        
        <Link to="/sos" className="nav-link-custom">
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
const CommunityEvents = () => {
  return (
    <div className="dashboard-container">
      {/* Sidebar Section */}
      <Sidebar />

      {/* Main Content Section */}
      <main className="main-content">
        
        {/* Header */}
        <div className="page-header">
          <div className="page-title">
            <h1>Community Events</h1>
            <div className="page-subtitle">Discover and participate in community events</div>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="events-empty-card">
          No upcoming events
        </div>

      </main>
    </div>
  );
};

export default CommunityEvents;
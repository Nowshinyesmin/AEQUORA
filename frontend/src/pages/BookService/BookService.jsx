// frontend/src/pages/BookService/BookService.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  AlertCircle, 
  Briefcase, 
  Calendar, 
  Bell, 
  LogOut,
  Search,
  User // Added User icon
} from "lucide-react";
import "./BookService.css";
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
        
        {/* Active State Here */}
        <Link to="/book-service" className="nav-link-custom active">
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
const BookService = () => {
  return (
    <div className="dashboard-container">
      {/* Sidebar Section */}
      <Sidebar />

      {/* Main Content Section */}
      <main className="main-content">
        
        {/* Header */}
        <div className="page-header">
          <div className="page-title">
            <h1>Services</h1>
            <div className="page-subtitle">Browse and book community services</div>
          </div>
        </div>

        {/* My Bookings Section */}
        <div className="bookings-section">
          <h2 className="section-title">My Bookings</h2>
          <div className="empty-bookings-content">
            No bookings yet. Book your first service below!
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search services..." 
          />
        </div>

        {/* Services List (Empty State) */}
        <div className="services-list-container">
          No services found
        </div>

      </main>
    </div>
  );
};

export default BookService;
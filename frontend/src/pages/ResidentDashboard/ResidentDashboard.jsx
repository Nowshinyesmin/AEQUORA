// frontend/src/pages/ResidentDashboard/ResidentDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertCircle, 
  Briefcase, 
  Calendar, 
  Bell, 
  LogOut, 
  Activity,
  User 
} from 'lucide-react';
import { Row, Col, Container } from 'react-bootstrap';

// Make sure this points to the new CSS file
import './ResidentDashboard.css';
import { api } from "../../api/client"; 

function ResidentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // State for user data
  const [userInfo, setUserInfo] = useState({
    firstName: 'Resident',
    lastName: '',
    role: 'Resident'
  });

  // Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

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
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getDisplayName = () => {
    return `${userInfo.firstName} ${userInfo.lastName}`;
  };

  return (
    <div className="dashboard-root">
      
      {/* Sidebar - Now scrollable due to overflow-y: auto in CSS */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          Aequora
        </div>

        <div className="user-profile-section">
          <div className="user-name-display">
             {loading ? '...' : getDisplayName()}
          </div>
          <div className="user-role-display">
            {userInfo.role}
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/resident/dashboard" className="nav-link-custom active">
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

      {/* Main Content */}
      <main className="dashboard-main">
        <Container fluid className="p-0">
          
          <div className="page-header-mb">
            <h1 className="page-title">Resident Dashboard</h1>
            <p className="page-subtitle">Welcome back! Here's what's happening in your community.</p>
          </div>

          <Row className="g-4">
            <Col md={4}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Total Issues Reported</span>
                  <AlertCircle size={22} className="text-danger" />
                </div>
                <div className="stat-value">0</div>
              </div>
            </Col>

            <Col md={4}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Total Bookings</span>
                  <Briefcase size={22} className="text-primary" />
                </div>
                <div className="stat-value">0</div>
              </div>
            </Col>

            <Col md={4}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Events Participated</span>
                  <Calendar size={22} className="text-success" />
                </div>
                <div className="stat-value">0</div>
              </div>
            </Col>
          </Row>

          <div className="activity-section-card">
            <div className="activity-header">
              <Activity size={20} className="me-2" />
              Recent Activities
            </div>
            <div className="empty-activity-state">
              No recent activities. Start by reporting an issue or booking a service!
            </div>
          </div>

        </Container>
      </main>
    </div>
  );
}

export default ResidentDashboard;
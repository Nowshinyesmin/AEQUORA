// frontend/src/pages/ResidentDashboard/ResidentDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, 
  Activity, User, CheckCircle, Clock
} from 'lucide-react';
import { Row, Col, Container, Badge } from 'react-bootstrap';
import './ResidentDashboard.css';
import { api } from "../../api/client"; 

function ResidentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // User Info State
  const [userInfo, setUserInfo] = useState({ firstName: 'Resident', lastName: '', role: 'Resident' });
  
  // Stats State
  const [dashboardData, setDashboardData] = useState({
    stats: { issues: 0, bookings: 0, events: 0 },
    activities: []
  });

  // Fetch All Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // 1. Fetch User Profile
        const userRes = await api.get('auth/users/me/');
        setUserInfo({
          firstName: userRes.data.firstname || '', // corrected field name from backend
          lastName: userRes.data.lastname || '',
          role: 'Resident' 
        });

        // 2. Fetch Dashboard Stats & Activities
        const dashRes = await api.get('resident/dashboard-stats/');
        setDashboardData(dashRes.data);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getDisplayName = () => `${userInfo.firstName} ${userInfo.lastName}`;

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  // Helper to get Icon based on activity type
  const getActivityIcon = (type) => {
    switch(type) {
      case 'Issue': return <AlertCircle size={18} className="text-danger" />;
      case 'Booking': return <Briefcase size={18} className="text-primary" />;
      case 'Event': return <Calendar size={18} className="text-success" />;
      default: return <Activity size={18} />;
    }
  };

  return (
    <div className="dashboard-root">
      
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">Aequora</div>
        <div className="user-profile-section">
          <div className="user-name-display">{loading ? '...' : getDisplayName()}</div>
          <div className="user-role-display">{userInfo.role}</div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/resident/dashboard" className="nav-link-custom active"><LayoutDashboard size={20} className="nav-icon" />Dashboard</Link>
          <Link to="/report-issue" className="nav-link-custom"><AlertCircle size={20} className="nav-icon" />Report Issue</Link>
          <Link to="/book-service" className="nav-link-custom"><Briefcase size={20} className="nav-icon" />Book Service</Link>
          <Link to="/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" />Events</Link>
          <Link to="/sos" className="nav-link-custom"><Bell size={20} className="nav-icon" />Emergency SOS</Link>
          <Link to="/profile" className="nav-link-custom"><User size={20} className="nav-icon" />Profile</Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <Container fluid className="p-0">
          
          <div className="page-header-mb">
            <h1 className="page-title">Resident Dashboard</h1>
            <p className="page-subtitle">Welcome back! Here's what's happening in your community.</p>
          </div>

          {/* Stats Row */}
          <Row className="g-4">
            <Col md={4}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Total Issues Reported</span>
                  <AlertCircle size={22} className="text-danger" />
                </div>
                <div className="stat-value">{dashboardData.stats.issues}</div>
              </div>
            </Col>

            <Col md={4}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Total Bookings</span>
                  <Briefcase size={22} className="text-primary" />
                </div>
                <div className="stat-value">{dashboardData.stats.bookings}</div>
              </div>
            </Col>

            <Col md={4}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Events Participated</span>
                  <Calendar size={22} className="text-success" />
                </div>
                <div className="stat-value">{dashboardData.stats.events}</div>
              </div>
            </Col>
          </Row>

          {/* Activity Section */}
          <div className="activity-section-card">
            <div className="activity-header">
              <Activity size={20} className="me-2" />
              Recent Activities
            </div>
            
            {dashboardData.activities.length === 0 ? (
              <div className="empty-activity-state">
                No recent activities. Start by reporting an issue or booking a service!
              </div>
            ) : (
              <div className="activity-list">
                {dashboardData.activities.map((item) => (
                  <div key={item.id} className="activity-item">
                    <div className="activity-icon-wrapper">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="activity-content">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="activity-title">{item.title}</span>
                        <small className="text-muted">{formatDate(item.date)}</small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <span className="activity-desc">{item.description}</span>
                        <Badge bg="light" text="dark" className="border">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </Container>
      </main>
    </div>
  );
}

export default ResidentDashboard;
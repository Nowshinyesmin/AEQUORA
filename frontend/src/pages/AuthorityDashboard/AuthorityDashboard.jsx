// frontend/src/pages/AuthorityDashboard/AuthorityDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart2,
  Siren,
  Calendar,
  Vote,
  LogOut,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Row, Col, Container, Card, ProgressBar } from 'react-bootstrap';

import './AuthorityDashboard.css'; 
import { api } from "../../api/client";

function AuthorityDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
 
  // State for user data
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    username: '',
    role: 'Authority'
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
          username: response.data.username || '',
          role: 'Authority'
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
    const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();
    return fullName || userInfo.username || 'Authority User';
  };

  return (
    <div className="dashboard-root">
     
      {/* --- Sidebar --- */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          Aequora
        </div>

        <div className="user-profile-section">
          <div className="user-name-display">
             {loading ? 'Loading...' : getDisplayName()}
          </div>
          <div className="user-role-display">
            {userInfo.role}
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/authority/dashboard" className="nav-link-custom active">
            <LayoutDashboard size={20} className="nav-icon" />
            Dashboard
          </Link>
         
          <Link to="/authority/manage-issues" className="nav-link-custom">
            <ClipboardList size={20} className="nav-icon" />
            Manage Issues
          </Link>
         
          <Link to="/authority/analytics" className="nav-link-custom">
            <BarChart2 size={20} className="nav-icon" />
            Analytics & Reports
          </Link>
         
          <Link to="/authority/events" className="nav-link-custom">
            <Calendar size={20} className="nav-icon" />
            Events & Requests
          </Link>
         
          <Link to="/authority/voting" className="nav-link-custom">
            <Vote size={20} className="nav-icon" />
            Community Voting
          </Link>

          <Link to="/authority/emergency" className="nav-link-custom text-danger">
            <Siren size={20} className="nav-icon" />
            Emergency SOS
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} className="me-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="dashboard-main">
        <Container fluid className="p-0">
         
          <div className="page-header-mb">
            <h1 className="page-title">Authority Dashboard</h1>
            <p className="page-subtitle">Manage reports, monitor data, and oversee community safety.</p>
          </div>

          {/* 1. Statistics Cards */}
          <Row className="g-4 mb-4">
            <Col md={4}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Total Issues Reported</span>
                  <AlertTriangle size={22} className="text-warning" />
                </div>
                <div className="stat-value">0</div>
                <small className="text-muted mt-2">All time reports</small>
              </div>
            </Col>

            <Col md={4}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Issues Resolved</span>
                  <CheckCircle size={22} className="text-success" />
                </div>
                <div className="stat-value">0</div>
                <small className="text-success mt-2">+0% this week</small>
              </div>
            </Col>

            <Col md={4}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Pending Tasks</span>
                  <Clock size={22} className="text-danger" />
                </div>
                <div className="stat-value">0</div>
                <small className="text-danger mt-2">Requires attention</small>
              </div>
            </Col>
          </Row>

          {/* 2. Charts Section Layout */}
          <Row className="g-4">
            <Col lg={8}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0 text-dark">Complaint Trends</h5>
                    <select className="form-select form-select-sm" style={{ width: '120px' }}>
                      <option>This Week</option>
                      <option>This Month</option>
                    </select>
                  </div>
                  <div className="d-flex align-items-center justify-content-center bg-light rounded" style={{ height: '300px' }}>
                    <span className="text-muted">Chart: Issue Frequency vs Time</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-dark">Satisfaction Rates</h5>
                 
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Issue Resolution</span>
                      <span className="fw-bold">0%</span>
                    </div>
                    <ProgressBar now={0} variant="success" style={{ height: '8px' }} />
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Response Time</span>
                      <span className="fw-bold">0%</span>
                    </div>
                    <ProgressBar now={0} variant="warning" style={{ height: '8px' }} />
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Community Feedback</span>
                      <span className="fw-bold">0%</span>
                    </div>
                    <ProgressBar now={0} variant="info" style={{ height: '8px' }} />
                  </div>
                 
                  <div className="text-center mt-auto">
                    <small className="text-muted">Based on post-resolution surveys</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* 3. Emergency Section REMOVED */}

        </Container>
      </main>
    </div>
  );
}

export default AuthorityDashboard;
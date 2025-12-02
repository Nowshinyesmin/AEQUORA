// frontend/src/pages/AnalyticsReports/AnalyticsReports.jsx

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
  Download,
  FileText,
  TrendingUp,
  MapPin,
  Clock,
  Smile
} from 'lucide-react';
import { Row, Col, Container, Card, ProgressBar, Button } from 'react-bootstrap';
import { api } from "../../api/client";
import './AnalyticsReports.css';

const AnalyticsReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // State for user profile (Sidebar)
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    username: '',
    role: 'Authority'
  });

  // State for Analytics Data
  const [analytics, setAnalytics] = useState({
    totalReports: 0,
    avgResolutionTime: '0 hrs', // Requirement: Avg resolution time
    satisfactionScore: 0,       // Requirement: Resident satisfaction
    categoryStats: [],          // Requirement: Reports per category
    topAreas: [],               // Requirement: Top areas
    resolutionTrend: [] 
  });

  // 1. Fetch User Data
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
      }
    };
    fetchUserData();
  }, [navigate]);

  // 2. Fetch Analytics Data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // NOTE: You will need to create this endpoint in your Django views later.
        // It should aggregate data from IssueReport and Review models.
        const response = await api.get('analytics/summary/');
        setAnalytics(response.data);
      } catch (err) {
        console.error("Backend not ready, using fallback structure for UI dev");
        // We keep the state empty or default if API fails
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getDisplayName = () => {
    const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();
    return fullName || userInfo.username || 'Authority User';
  };

  // --- CSV Export Logic ---
  const downloadCSV = () => {
    if (!analytics.categoryStats.length) {
      alert("No data to export");
      return;
    }

    // Convert category stats to CSV format
    const headers = ["Category,Count\n"];
    const rows = analytics.categoryStats.map(item => `${item.name},${item.count}\n`);
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join("");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="analytics-root">
      
      {/* --- SIDEBAR (Consistent with other pages) --- */}
      <aside className="analytics-sidebar">
        <div className="sidebar-brand">Aequora</div>

        <div className="user-profile-section">
          <div className="user-name-display">{getDisplayName()}</div>
          <div className="user-role-display">{userInfo.role}</div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/authority/dashboard" className="nav-link-custom">
            <LayoutDashboard size={20} className="nav-icon" />
            Dashboard
          </Link>
          <Link to="/authority/manage-issues" className="nav-link-custom">
            <ClipboardList size={20} className="nav-icon" />
            Manage Issues
          </Link>
          <Link to="/authority/analytics" className="nav-link-custom active">
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

      {/* --- MAIN CONTENT --- */}
      <main className="analytics-main">
        <Container fluid className="p-0">
          
          {/* Header & Exports */}
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <h1 className="page-title">Analytics & Reports</h1>
              <p className="page-subtitle">Data insights on community issues and performance.</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" className="d-flex align-items-center" onClick={downloadCSV}>
                <FileText size={18} className="me-2" /> Export CSV
              </Button>
              <Button variant="primary" className="d-flex align-items-center" onClick={() => window.print()}>
                <Download size={18} className="me-2" /> Print PDF
              </Button>
            </div>
          </div>

          {/* 1. Key Metrics Row */}
          <Row className="g-4 mb-4">
            {/* Avg Resolution Time */}
            <Col md={4}>
              <div className="metric-card">
                <div className="metric-icon-bg bg-light-blue">
                  <Clock size={24} className="text-primary" />
                </div>
                <div>
                  <div className="metric-label">Avg. Resolution Time</div>
                  <div className="metric-value">{analytics.avgResolutionTime || "0h 0m"}</div>
                  <small className="text-muted">Time from report to resolve</small>
                </div>
              </div>
            </Col>

            {/* Satisfaction Score */}
            <Col md={4}>
              <div className="metric-card">
                <div className="metric-icon-bg bg-light-green">
                  <Smile size={24} className="text-success" />
                </div>
                <div>
                  <div className="metric-label">Resident Satisfaction</div>
                  <div className="metric-value">{analytics.satisfactionScore || 0}/5.0</div>
                  <small className="text-success">Based on Feedback Reviews</small>
                </div>
              </div>
            </Col>

            {/* Total Reports */}
            <Col md={4}>
              <div className="metric-card">
                <div className="metric-icon-bg bg-light-purple">
                  <TrendingUp size={24} className="text-purple" />
                </div>
                <div>
                  <div className="metric-label">Total Reports Processed</div>
                  <div className="metric-value">{analytics.totalReports || 0}</div>
                  <small className="text-muted">All time cumulative</small>
                </div>
              </div>
            </Col>
          </Row>

          {/* 2. Detailed Charts Section */}
          <Row className="g-4">
            
            {/* Reports Per Category */}
            <Col lg={8}>
              <Card className="border-0 shadow-sm h-100 radius-12">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">Reports per Category</h5>
                  
                  {analytics.categoryStats.length > 0 ? (
                    <div className="category-chart-container">
                      {analytics.categoryStats.map((cat, index) => (
                        <div key={index} className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="fw-medium">{cat.name}</span>
                            <span className="text-muted">{cat.count} issues</span>
                          </div>
                          {/* Visual Bar representation */}
                          <ProgressBar 
                            now={(cat.count / analytics.totalReports) * 100} 
                            variant="primary" 
                            style={{ height: '10px', borderRadius: '5px' }} 
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-chart">
                      <BarChart2 size={48} className="text-muted mb-2" />
                      <p className="text-muted">No category data available yet.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Top Areas */}
            <Col lg={4}>
              <Card className="border-0 shadow-sm h-100 radius-12">
                <Card.Body className="p-4">
                  <h5 className="fw-bold mb-4">Top Problem Areas</h5>
                  <div className="top-areas-list">
                    {analytics.topAreas.length > 0 ? (
                      analytics.topAreas.map((area, index) => (
                        <div key={index} className="area-item">
                          <div className="d-flex align-items-center">
                            <div className="area-rank">{index + 1}</div>
                            <div>
                              <div className="fw-bold text-dark">{area.name}</div>
                              <small className="text-muted">{area.count} reports</small>
                            </div>
                          </div>
                          <MapPin size={18} className="text-danger" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-5 text-muted">
                        No area data found.
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

        </Container>
      </main>
    </div>
  );
};

export default AnalyticsReports;
// frontend/src/pages/AuthorityDashboard/AuthorityDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, BarChart2, Siren, Calendar, Vote, LogOut, CheckCircle, Clock, AlertTriangle, User, Bell, Smile
} from 'lucide-react';
import { Row, Col, Container, Card } from 'react-bootstrap';
import './AuthorityDashboard.css'; 
import { api } from "../../api/client";

function AuthorityDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', role: 'Authority' });
  const [stats, setStats] = useState({ 
    total_issues: 0, 
    resolved_issues: 0, 
    pending_issues: 0, 
    satisfaction_rate: 0,
    avg_resolution_time: "0 hrs" 
  });
  
  // Notification State
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const [userRes, statsRes, notifRes] = await Promise.all([
           api.get('auth/users/me/'),
           api.get('authority/dashboard-stats/'),
           api.get('authority/notifications/') 
        ]);

        setUserInfo({
          firstName: userRes.data.firstname || '', 
          lastName: userRes.data.lastname || '',
          role: userRes.data.role || 'Authority'
        });
        
        // Ensure defaults if backend returns nulls
        setStats({
            total_issues: statsRes.data.total_issues || 0,
            resolved_issues: statsRes.data.resolved_issues || 0,
            pending_issues: statsRes.data.pending_issues || 0,
            satisfaction_rate: statsRes.data.satisfaction_rate || 0,
            avg_resolution_time: statsRes.data.avg_resolution_time || "0 hrs"
        });

        setNotifCount(notifRes.data.unread_count);

      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  return (
    <div className="dashboard-root">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">Aequora</div>
        <div className="user-profile-section">
          <div className="user-name-display">{userInfo.firstName} {userInfo.lastName}</div>
          <div className="user-role-display">{userInfo.role}</div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/authority/dashboard" className="nav-link-custom active"><LayoutDashboard size={20} className="nav-icon" />Dashboard</Link>
          <Link to="/authority/manage-issues" className="nav-link-custom"><ClipboardList size={20} className="nav-icon" />Manage Issues</Link>
          <Link to="/authority/analytics" className="nav-link-custom"><BarChart2 size={20} className="nav-icon" />Analytics & Reports</Link>
          <Link to="/authority/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" />Events & Requests</Link>
          <Link to="/authority/voting" className="nav-link-custom"><Vote size={20} className="nav-icon" />Community Voting</Link>
          <Link to="/authority/emergency" className="nav-link-custom text-danger"><Siren size={20} className="nav-icon" />Emergency SOS</Link>
          <Link to="/authority/profile" className="nav-link-custom"><User size={20} className="nav-icon" />Profile</Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button>
        </div>
      </aside>

      <main className="dashboard-main">
        {/* BELL ICON IN HEADER */}
        <div className="header-right-actions">
           <div className="notification-wrapper" onClick={() => navigate('/authority/notifications')}>
             <Bell size={24} />
             {notifCount > 0 && <span className="notification-badge">{notifCount}</span>}
           </div>
        </div>

        <Container fluid className="p-0">
          <div className="page-header-mb">
            <h1 className="page-title">Authority Dashboard</h1>
            <p className="page-subtitle">Manage reports, monitor data, and oversee community safety.</p>
          </div>
          
          {/* Top Row: Total / Resolved / Pending */}
          <Row className="g-4 mb-4">
            <Col md={4}><div className="stat-card"><div className="stat-header"><span className="stat-title">Total Issues Reported</span><AlertTriangle size={22} className="text-warning" /></div><div className="stat-value">{stats.total_issues}</div><small className="text-muted mt-2">All time reports</small></div></Col>
            <Col md={4}><div className="stat-card"><div className="stat-header"><span className="stat-title">Issues Resolved</span><CheckCircle size={22} className="text-success" /></div><div className="stat-value">{stats.resolved_issues}</div><small className="text-success mt-2">Active Resolutions</small></div></Col>
            <Col md={4}><div className="stat-card"><div className="stat-header"><span className="stat-title">Pending Tasks</span><Clock size={22} className="text-danger" /></div><div className="stat-value">{stats.pending_issues}</div><small className="text-danger mt-2">Requires attention</small></div></Col>
          </Row>

          {/* Bottom Row: Avg Resolution Time & Resident Satisfaction */}
          <Row className="g-4">
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body className="p-4 d-flex align-items-center">
                  <div style={{ 
                      width: '60px', height: '60px', 
                      borderRadius: '12px', 
                      backgroundColor: '#e3f2fd', // Light Blue
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: '20px'
                  }}>
                    <Clock size={28} className="text-primary" />
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Average Resolution Time</h6>
                    <h3 className="fw-bold mb-0">{stats.avg_resolution_time}</h3>
                    <small className="text-muted">Time from report to resolve (Real-time)</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body className="p-4 d-flex align-items-center">
                  <div style={{ 
                      width: '60px', height: '60px', 
                      borderRadius: '12px', 
                      backgroundColor: '#e8f5e9', // Light Green
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: '20px'
                  }}>
                    <Smile size={28} className="text-success" />
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Resident Satisfaction</h6>
                    <h3 className="fw-bold mb-0">{stats.satisfaction_rate}/5.0</h3>
                    <small className="text-success">Based on Feedback Reviews (Real-time)</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

        </Container>
      </main>
    </div>
  );
}
export default AuthorityDashboard;
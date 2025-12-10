// frontend/src/pages/AuthorityDashboard/AuthorityDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, BarChart2, Siren, Calendar, Vote, LogOut, CheckCircle, Clock, AlertTriangle, User, Bell
} from 'lucide-react';
import { Row, Col, Container, Card, ProgressBar } from 'react-bootstrap';
import './AuthorityDashboard.css'; 
import { api } from "../../api/client";

function AuthorityDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', role: 'Authority' });
  const [stats, setStats] = useState({ total_issues: 0, resolved_issues: 0, pending_issues: 0, satisfaction_rate: 0 });
  
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
           api.get('authority/notifications/') // Fetch notification count
        ]);

        setUserInfo({
          firstName: userRes.data.firstname || '', 
          lastName: userRes.data.lastname || '',
          role: userRes.data.role || 'Authority'
        });
        setStats(statsRes.data);
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
          
          {/* --- FIXED LINK BELOW --- */}
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
          {/* Stats Cards */}
          <Row className="g-4 mb-4">
            <Col md={4}><div className="stat-card"><div className="stat-header"><span className="stat-title">Total Issues Reported</span><AlertTriangle size={22} className="text-warning" /></div><div className="stat-value">{stats.total_issues}</div><small className="text-muted mt-2">All time reports</small></div></Col>
            <Col md={4}><div className="stat-card"><div className="stat-header"><span className="stat-title">Issues Resolved</span><CheckCircle size={22} className="text-success" /></div><div className="stat-value">{stats.resolved_issues}</div><small className="text-success mt-2">Active Resolutions</small></div></Col>
            <Col md={4}><div className="stat-card"><div className="stat-header"><span className="stat-title">Pending Tasks</span><Clock size={22} className="text-danger" /></div><div className="stat-value">{stats.pending_issues}</div><small className="text-danger mt-2">Requires attention</small></div></Col>
          </Row>
          {/* Charts Placeholder (Same as before) */}
          <Row className="g-4">
            <Col lg={8}><Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}><Card.Body><h5 className="fw-bold mb-4 text-dark">Complaint Trends</h5><div className="d-flex align-items-center justify-content-center bg-light rounded" style={{ height: '300px' }}><span className="text-muted">Chart: Issue Frequency vs Time</span></div></Card.Body></Card></Col>
            <Col lg={4}><Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}><Card.Body><h5 className="fw-bold mb-4 text-dark">Satisfaction Rates</h5><div className="text-center mt-auto"><small className="text-muted">Based on post-resolution surveys</small></div></Card.Body></Card></Col>
          </Row>
        </Container>
      </main>
    </div>
  );
}
export default AuthorityDashboard;
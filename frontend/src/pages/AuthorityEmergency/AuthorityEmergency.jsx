// frontend/src/pages/AuthorityEmergency/AuthorityEmergency.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, BarChart2, Siren, Calendar, Vote, LogOut,
  MapPin, CheckCircle, ShieldAlert, Ambulance, Flame, User // <--- Added User icon
} from 'lucide-react';
import { Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { api } from "../../api/client"; 
import './AuthorityEmergency.css';

const AuthorityEmergency = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [emergencies, setEmergencies] = useState([]);
  
  // Sidebar User State
  const [userInfo, setUserInfo] = useState({
    firstName: '', lastName: '', username: '', role: 'Authority'
  });

  // --- 1. Fetch User Data (FIXED VARIABLE NAMES) ---
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
          // FIXED: Backend uses 'firstname', not 'first_name'
          firstName: response.data.firstname || '',
          // FIXED: Backend uses 'lastname', not 'last_name'
          lastName: response.data.lastname || '',
          username: response.data.username || '',
          role: response.data.role || 'Authority'
        });
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };
    fetchUserData();
  }, [navigate]);

  // --- 2. Fetch SOS Reports ---
  const fetchEmergencies = async () => {
    try {
      const response = await api.get('authority/sos/'); 
      setEmergencies(response.data);
    } catch (err) {
      console.error("Backend connection failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // --- Actions ---
  const handleResolve = async (id) => {
    if(!window.confirm("Confirm: Mark this emergency as SAFE/RESOLVED?")) return;
    try {
      await api.patch(`authority/sos/${id}/`, { status: 'Resolved' });
      fetchEmergencies(); 
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleDispatch = async (id, type) => {
    if(!window.confirm(`Confirm: Dispatch ${type} units to this location?`)) return;
    try {
      await api.post(`authority/sos/${id}/dispatch/`, { service: type });
      alert(`${type} units have been notified via automated alert.`);
    } catch (error) {
      alert("Failed to send dispatch signal");
    }
  };

  const openMap = (location) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
  };

  // --- DYNAMIC DISPATCH LOGIC ---
  const getDispatchOptions = (emergencyType) => {
    const type = (emergencyType || '').toUpperCase();
    switch (type) {
      case 'MEDICAL':
        return [{ label: 'Ambulance', icon: <Ambulance size={16}/>, color: 'danger' }];
      case 'FIRE':
        return [
          { label: 'Fire Dept', icon: <Flame size={16}/>, color: 'warning' },
          { label: 'Ambulance', icon: <Ambulance size={16}/>, color: 'danger' }
        ];
      case 'CRIME':
      case 'THEFT':
        return [{ label: 'Police', icon: <ShieldAlert size={16}/>, color: 'primary' }];
      case 'ACCIDENT':
        return [
          { label: 'Police', icon: <ShieldAlert size={16}/>, color: 'primary' },
          { label: 'Ambulance', icon: <Ambulance size={16}/>, color: 'danger' }
        ];
      default:
        return [
          { label: 'Police', icon: <ShieldAlert size={16}/>, color: 'primary' },
          { label: 'Fire Dept', icon: <Flame size={16}/>, color: 'warning' },
          { label: 'Ambulance', icon: <Ambulance size={16}/>, color: 'danger' }
        ];
    }
  };

  const activeEmergencies = emergencies.filter(e => e.status !== 'Resolved');
  const pastEmergencies = emergencies.filter(e => e.status === 'Resolved');

  return (
    <div className="authority-emergency-root">
      
      {/* --- SIDEBAR --- */}
      <aside className="emergency-sidebar">
        <div className="sidebar-brand">Aequora</div>
        <div className="user-profile-section">
          {/* FIXED: Dynamic Name Display */}
          <div className="user-name-display">{userInfo.firstName} {userInfo.lastName}</div>
          <div className="user-role-display">{userInfo.role}</div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/authority/dashboard" className="nav-link-custom"><LayoutDashboard size={20} className="nav-icon" /> Dashboard</Link>
          <Link to="/authority/manage-issues" className="nav-link-custom"><ClipboardList size={20} className="nav-icon" /> Manage Issues</Link>
          <Link to="/authority/analytics" className="nav-link-custom"><BarChart2 size={20} className="nav-icon" /> Analytics & Reports</Link>
          <Link to="/authority/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" /> Events & Requests</Link>
          <Link to="/authority/voting" className="nav-link-custom"><Vote size={20} className="nav-icon" /> Community Voting</Link>
          <Link to="/authority/sos" className="nav-link-custom text-danger active-danger"><Siren size={20} className="nav-icon" /> Emergency SOS</Link>
          {/* --- Added Profile Link --- */}
          <Link to="/authority/profile" className="nav-link-custom"><User size={20} className="nav-icon" /> Profile</Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" /> Logout</button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="emergency-main">
        <div className="emergency-header">
          <div>
            <h1 className="page-title text-danger">Emergency Management</h1>
            <p className="page-subtitle">Real-time monitoring and dispatch control.</p>
          </div>
          <div className="live-indicator">
            <span className="blink-dot"></span> Live Monitoring
          </div>
        </div>

        {/* --- ACTIVE ALERTS --- */}
        <h5 className="section-label">Active Emergencies ({activeEmergencies.length})</h5>
        
        {loading ? (
          <p>Loading data...</p>
        ) : activeEmergencies.length === 0 ? (
          <div className="safe-state-card">
            <CheckCircle size={48} className="text-success mb-3" />
            <h4>All Clear</h4>
            <p className="text-muted">No active SOS reports at this moment.</p>
          </div>
        ) : (
          <Row className="g-4 mb-5">
            {activeEmergencies.map((sos) => {
              const dispatchOptions = getDispatchOptions(sos.emergencytype);

              return (
                <Col lg={6} xl={4} key={sos.sosid || sos.id}>
                  <Card className="sos-card border-danger-glow">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-danger text-white">
                      <span className="fw-bold"><Siren size={18} className="me-2"/>{sos.emergencytype.toUpperCase()}</span>
                      <small>{new Date(sos.timestamp).toLocaleTimeString()}</small>
                    </Card.Header>
                    <Card.Body>
                      <div className="sos-info-row">
                        <MapPin size={18} className="text-danger me-2" />
                        <strong>{sos.location}</strong>
                      </div>
                      
                      <div className="sos-description-box">
                        {sos.description || "No description provided."}
                      </div>

                      {sos.photo && (
                          <div className="sos-image-preview mt-2">
                              <a href={sos.photo} target="_blank" rel="noreferrer">View Evidence Photo</a>
                          </div>
                      )}

                      <hr />
                      
                      <div className="dispatch-controls">
                        <p className="mb-2 fw-bold text-muted" style={{fontSize: '0.8rem'}}>RECOMMENDED DISPATCH:</p>
                        <div className="d-flex gap-2 mb-3 flex-wrap">
                          {dispatchOptions.map((opt, idx) => (
                             <Button 
                               key={idx}
                               variant={`outline-${opt.color}`} 
                               size="sm" 
                               className="flex-grow-1"
                               onClick={() => handleDispatch(sos.sosid || sos.id, opt.label.toUpperCase())}
                             >
                               {opt.icon} <span className="ms-1">{opt.label}</span>
                             </Button>
                          ))}
                        </div>
                        <Button variant="success" size="sm" className="w-100" onClick={() => handleResolve(sos.sosid || sos.id)}>
                          <CheckCircle size={16} className="me-1"/> Mark Resolved
                        </Button>
                      </div>

                      <div className="mt-3 text-center">
                         <Button variant="link" size="sm" onClick={() => openMap(sos.location)}>
                            Open in Google Maps
                         </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* --- HISTORY --- */}
        <h5 className="section-label mt-4">Resolved History</h5>
        <Card className="border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Reported Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pastEmergencies.length > 0 ? pastEmergencies.map((sos) => (
                   <tr key={sos.sosid || sos.id}>
                     <td><Badge bg="secondary">{sos.emergencytype}</Badge></td>
                     <td>{sos.location}</td>
                     <td>{new Date(sos.timestamp).toLocaleString()}</td>
                     <td><span className="text-success fw-bold">Resolved</span></td>
                   </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center py-3 text-muted">No history available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </main>
    </div>
  );
};

export default AuthorityEmergency;
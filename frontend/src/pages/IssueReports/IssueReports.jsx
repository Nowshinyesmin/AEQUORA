// frontend/src/pages/IssueReports/IssueReports.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, Plus, User, MapPin, Clock, ThumbsUp } from "lucide-react";
import { Button, Form, Modal, Tabs, Tab } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import "./IssueReports.css";
import { api } from "../../api/client"; 
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Sidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ firstName: 'Resident', lastName: '', role: 'Resident' });
  useEffect(() => {
    const fetchUserData = async () => {
      try { const response = await api.get('auth/users/me/'); setUserInfo({ firstName: response.data.firstname || 'Resident', lastName: response.data.lastname || '', role: 'Resident' }); } catch (error) { console.error(error); }
    };
    fetchUserData();
  }, []);
  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">Aequora</div>
      <div className="user-profile-section"><div className="user-name-display">{userInfo.firstName} {userInfo.lastName}</div><div className="user-role-display">{userInfo.role}</div></div>
      <nav className="sidebar-nav">
        <Link to="/resident/dashboard" className="nav-link-custom"><LayoutDashboard size={20} className="nav-icon" />Dashboard</Link>
        <Link to="/report-issue" className="nav-link-custom active"><AlertCircle size={20} className="nav-icon" />Report Issue</Link>
        <Link to="/community-voting" className="nav-link-custom"><ThumbsUp size={20} className="nav-icon" />Community Voting</Link>
        <Link to="/book-service" className="nav-link-custom"><Briefcase size={20} className="nav-icon" />Book Service</Link>
        <Link to="/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" />Events</Link>
        <Link to="/sos" className="nav-link-custom"><Bell size={20} className="nav-icon" />Emergency SOS</Link>
        <Link to="/profile" className="nav-link-custom"><User size={20} className="nav-icon" />Profile</Link>
      </nav>
      <div className="sidebar-footer"><button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button></div>
    </aside>
  );
};

const LocationMarker = ({ position, setPosition, setAddress, setAddressLoading }) => {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, map.getZoom()); }, [position, map]);
  useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      setAddressLoading(true);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`)
        .then(res => res.json()).then(data => { setAddress(data.display_name); setAddressLoading(false); })
        .catch(() => { setAddress(`${newPos.lat}, ${newPos.lng}`); setAddressLoading(false); });
    },
  });
  return position === null ? null : <Marker position={position} />;
};

const IssueReports = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [formData, setFormData] = useState({ title: "", type: "", description: "", prioritylevel: "Medium", mapaddress: "" });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [position, setPosition] = useState({ lat: 23.8103, lng: 90.4125 }); 
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem('resident_notifications');
    const initData = async () => {
        try {
            const userRes = await api.get('auth/users/me/');
            if(userRes.data.userid) {
                setCurrentUserId(userRes.data.userid);
                fetchBadgeCount(userRes.data.userid);
            }
        } catch(e) { console.error(e); }
    };
    initData();
    fetchIssues();
  }, []);

  const fetchBadgeCount = async (userId) => {
    try {
      const response = await api.get('resident/notifications/');
      const dbData = response.data.notifications;
      const mappedDbNotifs = dbData.map(n => ({ id: `db-${n.notificationid}`, read: n.isread }));
      const storageKey = `resident_notifications_user_${userId}`;
      const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const merged = [...localData, ...mappedDbNotifs];
      setNotificationCount(merged.filter(n => !n.read).length);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (showModal) setTimeout(() => handleGetLocation(), 500); }, [showModal]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setAddressLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(newPos);
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`)
            .then(res => res.json()).then(data => { setFormData(prev => ({ ...prev, mapaddress: data.display_name })); setAddressLoading(false); })
            .catch(() => { setFormData(prev => ({ ...prev, mapaddress: `${newPos.lat}, ${newPos.lng}` })); setAddressLoading(false); });
        },
        () => setAddressLoading(false)
      );
    }
  };

  const fetchIssues = async () => { try { const response = await api.get('resident/issues/'); setIssues(response.data); } catch (error) { console.error("Failed to fetch issues:", error); } };
  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    try {
      await api.post('resident/issues/', formData);
      
      // --- REMOVED MANUAL LOCAL STORAGE NOTIFICATION ---
      // DB handles it.

      alert("Issue reported successfully!");
      setShowModal(false); 
      setFormData({ title: "", type: "", description: "", prioritylevel: "Medium", mapaddress: "" });
      fetchIssues(); 
      if (currentUserId) fetchBadgeCount(currentUserId);
    } catch (error) { console.error("Failed to report issue:", error); alert("Failed to submit report."); }
  };

  const handleNotificationClick = () => { navigate('/notifications'); };
  
  const renderIssueList = (filter) => {
    const filtered = filter === "All" ? issues : issues.filter(issue => issue.status === filter);
    if (filtered.length === 0) return <div className="empty-state-card">No issues found in this category.</div>;
    return (
      <div className="issues-list">
        {filtered.map((issue) => (
          <div key={issue.issueid} className="settings-card mb-3 p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h5 style={{fontWeight: '700', fontSize: '1.1rem'}}>{issue.title}</h5>
                <p style={{color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem'}}>{issue.description}</p>
                <div className="d-flex gap-3 text-muted" style={{fontSize: '0.85rem'}}>
                  <span><MapPin size={14} className="me-1"/> {issue.mapaddress || 'No location'}</span>
                  <span><Clock size={14} className="me-1"/> {new Date(issue.createdat).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={`badge bg-${issue.status === 'Resolved' ? 'success' : issue.status === 'In Progress' ? 'warning' : 'secondary'}`}>
                {issue.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title"><h1>Issue Reports</h1><div className="page-subtitle">Report and track community issues</div></div>
          <div className="header-actions-container">
            <Button variant="dark" className="d-flex align-items-center gap-2" onClick={() => setShowModal(true)}><Plus size={18} /> Report Issue</Button>
            <div className="notification-wrapper" onClick={handleNotificationClick}>
               <Bell size={24} />
               {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
            </div>
          </div>
        </div>
        <Tabs activeKey={activeFilter} onSelect={(k) => setActiveFilter(k)} className="mb-4 custom-tabs">
          <Tab eventKey="All" title="All">{renderIssueList("All")}</Tab>
          <Tab eventKey="Pending" title="Pending">{renderIssueList("Pending")}</Tab>
          <Tab eventKey="In Progress" title="In Progress">{renderIssueList("In Progress")}</Tab>
          <Tab eventKey="Resolved" title="Resolved">{renderIssueList("Resolved")}</Tab>
        </Tabs>
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
          <Modal.Header closeButton><Modal.Title>Report New Issue</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3"><Form.Label className="custom-label">Title *</Form.Label><Form.Control type="text" name="title" value={formData.title} onChange={handleChange} className="custom-input" required /></Form.Group>
              <Form.Group className="mb-3"><Form.Label className="custom-label">Type</Form.Label><Form.Control type="text" name="type" value={formData.type} onChange={handleChange} placeholder="e.g., Infrastructure, Sanitation" className="custom-input" /></Form.Group>
              <Form.Group className="mb-3"><Form.Label className="custom-label">Description</Form.Label><Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} className="custom-input" /></Form.Group>
              <Form.Group className="mb-3"><Form.Label className="custom-label">Priority Level</Form.Label><Form.Select name="prioritylevel" value={formData.prioritylevel} onChange={handleChange} className="custom-input"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></Form.Select></Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="custom-label">Location</Form.Label>
                <div className="d-flex gap-2 mb-2">
                  <Form.Control type="text" name="mapaddress" value={formData.mapaddress} onChange={handleChange} placeholder={addressLoading ? "Detecting..." : "Enter or pin location"} className="custom-input" />
                  <Button variant="outline-secondary" onClick={handleGetLocation}><MapPin size={18} /></Button>
                </div>
                <div style={{ height: '250px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ddd' }}>
                  {showModal && (<MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><LocationMarker position={position} setPosition={setPosition} setAddress={(addr) => setFormData(prev => ({...prev, mapaddress: addr}))} setAddressLoading={setAddressLoading} /></MapContainer>)}
                </div>
              </Form.Group>
              <Button type="submit" variant="dark" className="w-100 btn-submit-issue">Submit Issue Report</Button>
            </Form>
          </Modal.Body>
        </Modal>
      </main>
    </div>
  );
};
export default IssueReports;
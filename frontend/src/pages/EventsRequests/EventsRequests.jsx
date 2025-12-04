// frontend/src/pages/EventsRequests/EventsRequests.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, ClipboardList, BarChart2, Calendar, Vote, Siren, 
  LogOut, Plus, MapPin, Clock, CheckCircle, XCircle 
} from "lucide-react";
import { Modal, Button, Form, Badge } from "react-bootstrap";
import { api } from "../../api/client"; 
import "./EventsRequests.css";

// --- Authority Sidebar (Now fetches data dynamically) ---
const AuthoritySidebar = () => {
  const navigate = useNavigate();
  // FIXED: Added state to store fetched user info
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    role: 'Authority'
  });

  // FIXED: Added fetch logic
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('auth/users/me/');
        setUserInfo({
          firstName: response.data.firstname || 'Authority',
          lastName: response.data.lastname || 'User',
          role: response.data.role || 'AUTHORITY'
        });
      } catch (error) {
        console.error("Failed to fetch sidebar user", error);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const displayName = `${userInfo.firstName} ${userInfo.lastName}`.trim();

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">Aequora</div>
      <div className="user-profile-section">
        {/* FIXED: Display dynamic name */}
        <div className="user-name-display">{displayName}</div>
        <div className="user-role-display">{userInfo.role.toUpperCase()}</div>
      </div>
      <nav className="sidebar-nav">
        <Link to="/authority/dashboard" className="nav-link-custom">
          <LayoutDashboard size={20} className="nav-icon" />Dashboard
        </Link>
        <Link to="/authority/manage-issues" className="nav-link-custom">
          <ClipboardList size={20} className="nav-icon" />Manage Issues
        </Link>
        <Link to="/authority/analytics" className="nav-link-custom">
          <BarChart2 size={20} className="nav-icon" />Analytics & Reports
        </Link>
        <Link to="/authority/events" className="nav-link-custom active">
          <Calendar size={20} className="nav-icon" />Events & Requests
        </Link>
        <Link to="/authority/voting" className="nav-link-custom">
          <Vote size={20} className="nav-icon" />Community Voting
        </Link>
        <Link to="/authority/sos" className="nav-link-custom" style={{ color: '#ef4444' }}>
          <Siren size={20} className="nav-icon" />Emergency SOS
        </Link>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} className="me-2" />Logout
        </button>
      </div>
    </aside>
  );
};

// --- Main Component ---
const EventsRequests = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [events, setEvents] = useState([]); 
  const [requests, setRequests] = useState([]); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State for New Event
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    category: "Community",
    description: ""
  });

  // Fetch Data on Load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, requestsRes] = await Promise.all([
         api.get('authority/events/'),
         api.get('authority/events/requests/')
      ]);
      setEvents(eventsRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('authority/events/', newEvent);
      setShowCreateModal(false);
      fetchData(); // Refresh list
      setNewEvent({ title: "", date: "", time: "", location: "", category: "Community", description: "" });
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event.");
    }
  };

  const handleRequestAction = async (eventId, action) => {
    try {
      await api.post(`authority/events/${eventId}/action/`, { action });
      fetchData(); // Refresh lists
    } catch (error) {
      console.error(`Error ${action}ing event:`, error);
      alert(`Failed to ${action} event.`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if(!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`authority/events/${eventId}/`);
      fetchData();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <AuthoritySidebar />
      <main className="main-content">
        
        {/* Header */}
        <div className="page-header">
          <div className="page-title">
            <h1>Events & Requests</h1>
            <div className="page-subtitle">Manage community announcements and approve resident requests</div>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)} className="d-flex align-items-center gap-2">
            <Plus size={18} /> Post New Event
          </Button>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Events ({events.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Pending Requests 
            {requests.length > 0 && <span className="tab-badge">{requests.length}</span>}
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-5">Loading...</div>
        ) : (
          <div className="row g-4">
            
            {/* VIEW 1: ACTIVE EVENTS */}
            {activeTab === 'active' && (
              events.length === 0 ? (
                <div className="col-12"><div className="empty-state">No active events found.</div></div>
              ) : (
                events.map(event => (
                  <div className="col-md-6 col-xl-4" key={event.eventid}>
                    <div className="event-card">
                      <div className="event-card-body">
                        <div className="d-flex justify-content-between mb-2">
                          <Badge bg="info" text="dark">{event.category}</Badge>
                          <small className="text-muted">{event.date}</small>
                        </div>
                        <h4 className="fw-bold mb-2">{event.title}</h4>
                        <p className="text-muted small mb-3">{event.description}</p>
                        <div className="d-flex gap-3 text-muted small">
                          <span><Clock size={14}/> {event.time}</span>
                          <span><MapPin size={14}/> {event.location}</span>
                        </div>
                      </div>
                      <div className="event-card-footer justify-content-end">
                         <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => handleDeleteEvent(event.eventid)}
                          >
                            Delete
                          </Button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {/* VIEW 2: PENDING REQUESTS */}
            {activeTab === 'requests' && (
              requests.length === 0 ? (
                <div className="col-12"><div className="empty-state">No pending requests from residents.</div></div>
              ) : (
                requests.map(req => (
                  <div className="col-md-6 col-xl-4" key={req.eventid}>
                    <div className="event-card" style={{borderColor: '#f59e0b'}}>
                      <div className="event-card-body">
                         <div className="d-flex justify-content-between mb-2">
                            <Badge bg="warning" text="dark">Request</Badge>
                            <small className="text-muted">Posted by: {req.posted_by_name}</small>
                          </div>
                        <h4 className="fw-bold mb-2">{req.title}</h4>
                        <p className="text-muted small mb-3">{req.description}</p>
                         <div className="d-flex gap-3 text-muted small">
                          <span><Clock size={14}/> {req.time}</span>
                          <span><MapPin size={14}/> {req.location}</span>
                        </div>
                      </div>
                      <div className="event-card-footer">
                        <button className="btn-approve" onClick={() => handleRequestAction(req.eventid, 'approve')}>
                          <CheckCircle size={16} className="me-1"/> Approve
                        </button>
                        <button className="btn-reject" onClick={() => handleRequestAction(req.eventid, 'reject')}>
                          <XCircle size={16} className="me-1"/> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}

        {/* --- Create Event Modal --- */}
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Post New Event</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleCreateSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Event Title</Form.Label>
                <Form.Control type="text" required value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} />
              </Form.Group>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control type="date" required value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Time</Form.Label>
                  <Form.Control type="time" required value={newEvent.time} onChange={(e) => setNewEvent({...newEvent, time: e.target.value})} />
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control type="text" required placeholder="e.g., Community Hall" value={newEvent.location} onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select value={newEvent.category} onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}>
                  <option value="Community">Community</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Social">Social</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={3} required value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Publish Event</Button>
            </Modal.Footer>
          </Form>
        </Modal>

      </main>
    </div>
  );
};

export default EventsRequests;
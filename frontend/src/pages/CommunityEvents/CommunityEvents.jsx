// frontend/src/pages/CommunityEvents/CommunityEvents.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, 
  User, MapPin, Clock, CheckCircle, XCircle
} from "lucide-react";
import { Modal, Button, Badge } from "react-bootstrap";
import "./CommunityEvents.css";
import { api } from "../../api/client"; 

// --- Sidebar (Same as before) ---
const Sidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ firstName: 'Resident', lastName: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('auth/users/me/');
        setUserInfo({
          firstName: response.data.firstname || 'Resident',
          lastName: response.data.lastname || ''
        });
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">Aequora</div>
      <div className="user-profile-section">
        <div className="user-name-display">{userInfo.firstName} {userInfo.lastName}</div>
        <div className="user-role-display">Resident</div>
      </div>
      <nav className="sidebar-nav">
        <Link to="/resident/dashboard" className="nav-link-custom"><LayoutDashboard size={20} className="nav-icon" />Dashboard</Link>
        <Link to="/report-issue" className="nav-link-custom"><AlertCircle size={20} className="nav-icon" />Report Issue</Link>
        <Link to="/book-service" className="nav-link-custom"><Briefcase size={20} className="nav-icon" />Book Service</Link>
        <Link to="/events" className="nav-link-custom active"><Calendar size={20} className="nav-icon" />Events</Link>
        <Link to="/sos" className="nav-link-custom"><Bell size={20} className="nav-icon" />Emergency SOS</Link>
        <Link to="/profile" className="nav-link-custom"><User size={20} className="nav-icon" />Profile</Link>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button>
      </div>
    </aside>
  );
};

// --- Main Page Component ---
const CommunityEvents = () => {
  const [events, setEvents] = useState([]);
  const [participations, setParticipations] = useState({}); // Map of eventId -> status
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Events & Participations
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Parallel fetch
      const [eventsRes, partRes] = await Promise.all([
        api.get('resident/events/'),
        api.get('resident/events/participate/')
      ]);

      setEvents(eventsRes.data);
      
      // Convert participation array to a simpler map: { eventId: 'Going', ... }
      const partMap = {};
      partRes.data.forEach(p => {
        partMap[p.eventid] = p.interesttype;
      });
      setParticipations(partMap);

    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Event Click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // 3. Handle Participation Choice
  const handleParticipation = async (action) => {
    if (!selectedEvent) return;
    
    try {
      await api.post('resident/events/participate/', {
        eventid: selectedEvent.eventid,
        action: action // 'participate' or 'ignore'
      });
      
      // Update local state immediately for UI feedback
      setParticipations(prev => ({
        ...prev,
        [selectedEvent.eventid]: action === 'participate' ? 'Going' : 'Ignored'
      }));
      
      setShowModal(false);
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        
        <div className="page-header">
          <div className="page-title">
            <h1>Community Events</h1>
            <div className="page-subtitle">Discover and participate in upcoming events</div>
          </div>
        </div>

        {loading ? (
          <div>Loading events...</div>
        ) : events.length === 0 ? (
          <div className="events-empty-card">
            No upcoming events in your community.
          </div>
        ) : (
          <div className="row g-4">
            {events.map(event => {
              const status = participations[event.eventid];
              const isParticipating = status === 'Going';
              
              return (
                <div className="col-md-6 col-xl-4" key={event.eventid}>
                  <div 
                    className={`event-card ${isParticipating ? 'participating-card' : ''}`}
                    onClick={() => handleEventClick(event)}
                  >
                    {/* Green Banner if participating */}
                    {isParticipating && (
                      <div className="participation-badge">
                        <CheckCircle size={14} className="me-1"/> Participating
                      </div>
                    )}

                    <div className="event-card-body p-4">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg="info" className="text-dark">{event.category}</Badge>
                        <small className="text-muted">{event.date} at {event.time}</small>
                      </div>
                      
                      <h4 className="mb-2" style={{fontWeight: '700', color: isParticipating ? '#064e3b' : '#111827'}}>
                        {event.title}
                      </h4>
                      
                      <p className="text-muted mb-3 small line-clamp-2">
                        {event.description}
                      </p>

                      <div className="d-flex align-items-center text-muted small">
                        <MapPin size={16} className="me-2" />
                        {event.location}
                      </div>
                      
                      <div className="mt-3 text-muted small">
                        Posted by: {event.posted_by_name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- Participation Modal --- */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          {selectedEvent && (
            <>
              <Modal.Header closeButton>
                <Modal.Title>{selectedEvent.title}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p><strong>Date:</strong> {selectedEvent.date} at {selectedEvent.time}</p>
                <p><strong>Location:</strong> {selectedEvent.location}</p>
                <p>{selectedEvent.description}</p>
                <hr />
                <p className="mb-2">Are you interested in attending this event?</p>
                <div className="d-flex gap-3">
                  <Button 
                    variant="success" 
                    className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => handleParticipation('participate')}
                  >
                    <CheckCircle size={18}/> Participating
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => handleParticipation('ignore')}
                  >
                    <XCircle size={18}/> Ignore
                  </Button>
                </div>
              </Modal.Body>
            </>
          )}
        </Modal>

      </main>
    </div>
  );
};

export default CommunityEvents;
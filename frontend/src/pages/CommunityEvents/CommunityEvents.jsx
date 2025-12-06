// frontend/src/pages/CommunityEvents/CommunityEvents.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, 
  User, MapPin, CheckCircle, XCircle, ThumbsUp, Plus, Clock, Loader
} from "lucide-react";
import { Modal, Button, Badge, Form, Tabs, Tab } from "react-bootstrap";
import "./CommunityEvents.css";
import { api } from "../../api/client"; 

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
        <Link to="/community-voting" className="nav-link-custom"><ThumbsUp size={20} className="nav-icon" />Community Voting</Link>
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

const CommunityEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]); 
  const [participations, setParticipations] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Request Form State
  const [requestData, setRequestData] = useState({
    title: "", description: "", date: "", time: "", location: "", category: "General"
  });

  useEffect(() => {
    // 1. CLEANUP OLD DATA
    localStorage.removeItem('resident_notifications');

    const initData = async () => {
        try {
            // Fetch User ID first
            const userRes = await api.get('auth/users/me/');
            if(userRes.data.userid) {
                setCurrentUserId(userRes.data.userid);
                // Fetch Synchronized Badge Count
                fetchBadgeCount(userRes.data.userid);
            }
        } catch(e) { console.error(e); }
    };

    initData();
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, partRes, pendingRes] = await Promise.all([
        api.get('resident/events/'),
        api.get('resident/events/participate/'),
        api.get('resident/events/pending/') 
      ]);

      setEvents(eventsRes.data);
      setPendingEvents(pendingRes.data); 
      
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

  // --- SYNCHRONIZED BADGE LOGIC ---
  const fetchBadgeCount = async (userId) => {
    if (!userId) return;
    try {
      // 1. Fetch DB Notifications
      const response = await api.get('resident/notifications/');
      const dbData = response.data.notifications;
      
      const mappedDbNotifs = dbData.map(n => ({
        id: `db-${n.notificationid}`,
        read: n.isread, 
        timestamp: new Date(n.createdat).getTime()
      }));

      // 2. Fetch User-Specific Local Storage
      const storageKey = `resident_notifications_user_${userId}`;
      const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // 3. Merge & Count Unread
      const merged = [...localData, ...mappedDbNotifs];
      const totalUnread = merged.filter(n => !n.read).length;

      setNotificationCount(totalUnread);
    } catch (error) {
      console.error("Failed to fetch notification count", error);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleParticipation = async (action) => {
    if (!selectedEvent) return;
    try {
      await api.post('resident/events/participate/', {
        eventid: selectedEvent.eventid,
        action: action
      });
      setParticipations(prev => ({
        ...prev,
        [selectedEvent.eventid]: action === 'participate' ? 'Going' : 'Ignored'
      }));
      
      // --- REMOVED MANUAL LOCAL NOTIFICATION ---
      // The Database & signals.py handle this automatically now.
      
      // Refresh badge immediately if participating
      if (action === 'participate' && currentUserId) {
          await fetchBadgeCount(currentUserId);
      }

      setShowModal(false);
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleRequestChange = (e) => {
    setRequestData({ ...requestData, [e.target.name]: e.target.value });
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('resident/events/request/', requestData);
      
      alert("Event request sent to Authority for approval!");
      setShowRequestModal(false);
      setRequestData({ title: "", description: "", date: "", time: "", location: "", category: "General" });
      
      fetchData(); 
    } catch (error) {
      console.error("Failed to request event:", error);
      alert("Failed to submit request.");
    }
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        
        <div className="header-right-actions">
           <div className="notification-wrapper" onClick={handleNotificationClick}>
             <Bell size={24} />
             {notificationCount > 0 && (
               <span className="notification-badge">{notificationCount}</span>
             )}
           </div>
        </div>

        <div className="page-header d-flex justify-content-between align-items-end">
          <div>
            <div className="page-title">
              <h1>Community Events</h1>
              <div className="page-subtitle">Discover and participate in upcoming events</div>
            </div>
          </div>
          <Button 
            variant="dark" 
            className="d-flex align-items-center gap-2" 
            onClick={() => setShowRequestModal(true)}
          >
            <Plus size={18} /> Request Event
          </Button>
        </div>

        {/* --- TABS SECTION --- */}
        <Tabs defaultActiveKey="upcoming" id="event-tabs" className="mb-4 custom-tabs">
            
            {/* TAB 1: UPCOMING (PUBLISHED) */}
            <Tab eventKey="upcoming" title="Upcoming Events">
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
            </Tab>

            {/* TAB 2: MY REQUESTS (PENDING) */}
            <Tab eventKey="requests" title="My Requests">
                {loading ? (
                    <div>Loading requests...</div>
                ) : pendingEvents.length === 0 ? (
                    <div className="events-empty-card">
                        You have no pending event requests.
                    </div>
                ) : (
                    <div className="row g-4">
                        {pendingEvents.map(event => (
                            <div className="col-md-6 col-xl-4" key={event.eventid}>
                                <div className="event-card" style={{opacity: 0.8}}>
                                    <div className="participation-badge" style={{backgroundColor: '#eab308'}}>
                                        <Clock size={14} className="me-1"/> Pending Approval
                                    </div>

                                    <div className="event-card-body p-4" style={{paddingTop: '2rem'}}>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <Badge bg="secondary">{event.category}</Badge>
                                            <small className="text-muted">Requested Date: {event.date}</small>
                                        </div>
                                        
                                        <h4 className="mb-2" style={{fontWeight: '700', color: '#6b7280'}}>
                                            {event.title}
                                        </h4>
                                        
                                        <p className="text-muted mb-3 small line-clamp-2">
                                            {event.description}
                                        </p>

                                        <div className="d-flex align-items-center text-muted small">
                                            <MapPin size={16} className="me-2" />
                                            {event.location}
                                        </div>
                                        
                                        <div className="mt-3 text-muted small fst-italic">
                                            Waiting for Authority Approval...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Tab>

        </Tabs>

        {/* DETAILS & PARTICIPATION MODAL */}
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

        {/* REQUEST EVENT MODAL */}
        <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Request New Event</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleRequestSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Event Title *</Form.Label>
                <Form.Control type="text" name="title" value={requestData.title} onChange={handleRequestChange} required placeholder="e.g., Summer BBQ" />
              </Form.Group>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control type="date" name="date" value={requestData.date} onChange={handleRequestChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Label>Time *</Form.Label>
                  <Form.Control type="time" name="time" value={requestData.time} onChange={handleRequestChange} required />
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Location *</Form.Label>
                <Form.Control type="text" name="location" value={requestData.location} onChange={handleRequestChange} required placeholder="e.g., Community Hall" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select name="category" value={requestData.category} onChange={handleRequestChange}>
                  <option value="General">General</option>
                  <option value="Sports">Sports</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Party">Party</option>
                  <option value="Notice">Notice</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={3} name="description" value={requestData.description} onChange={handleRequestChange} placeholder="Describe the event..." />
              </Form.Group>
              <Button type="submit" variant="dark" className="w-100">Submit Request</Button>
            </Form>
          </Modal.Body>
        </Modal>

      </main>
    </div>
  );
};

export default CommunityEvents;
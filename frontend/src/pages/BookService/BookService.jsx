// frontend/src/pages/BookService/BookService.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, 
  Search, User, MapPin, Clock, CreditCard, X, CheckCircle, ThumbsUp, Trash2
} from "lucide-react";
import { Modal, Button, Form, Badge, Tabs, Tab } from "react-bootstrap";
import "./BookService.css"; 
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
        <Link to="/book-service" className="nav-link-custom active"><Briefcase size={20} className="nav-icon" />Book Service</Link>
        <Link to="/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" />Events</Link>
        <Link to="/sos" className="nav-link-custom"><Bell size={20} className="nav-icon" />Emergency SOS</Link>
        <Link to="/profile" className="nav-link-custom"><User size={20} className="nav-icon" />Profile</Link>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button>
      </div>
    </aside>
  );
};

const BookService = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [notificationCount, setNotificationCount] = useState(0);

  const [serviceDate, setServiceDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isBooking, setIsBooking] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]); // To track which items are deleting

  useEffect(() => {
    localStorage.removeItem('resident_notifications');

    const fetchUserAndData = async () => {
        try {
            const res = await api.get('auth/users/me/');
            if(res.data.userid) {
                const uid = res.data.userid;
                setCurrentUserId(uid);
                fetchBadgeCount(uid);
            }
        } catch(e) { console.error(e); }
    };

    fetchUserAndData();
    fetchServices();
    fetchBookings();
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = () => {
    const query = new URLSearchParams(window.location.search);
    const status = query.get('payment');

    if (status) {
        if (status === 'success') {
            alert("Payment Successful! Your booking is confirmed.");
        } else if (status === 'failed') {
            alert("Payment Failed or Cancelled. Please try again.");
        }
        window.history.replaceState({}, document.title, window.location.pathname);
        fetchBookings();
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get('resident/services/');
      setServices(res.data);
    } catch (err) {
      console.error("Error fetching services", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get('resident/bookings/');
      setBookings(res.data);
    } catch (err) {
      console.error("Error fetching bookings", err);
    }
  };

  const fetchBadgeCount = async (userId) => {
    if (!userId) return;
    try {
      const response = await api.get('resident/notifications/');
      const dbData = response.data.notifications;
      
      const mappedDbNotifs = dbData.map(n => ({
        id: `db-${n.notificationid}`,
        read: n.isread, 
        timestamp: new Date(n.createdat).getTime()
      }));

      const storageKey = `resident_notifications_user_${userId}`;
      const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const merged = [...localData, ...mappedDbNotifs];
      const totalUnread = merged.filter(n => !n.read).length;

      setNotificationCount(totalUnread);
    } catch (error) {
      console.error("Failed to fetch notification count", error);
    }
  };

  const filteredServices = services.filter(service => 
    service.servicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const requestedBookings = bookings.filter(b => b.status === 'Pending');
  const upcomingBookings = bookings.filter(b => 
    b.status === 'Accepted' && b.servicedate >= getTodayDate()
  );
  const historyBookings = bookings.filter(b => 
    b.status === 'Completed' || 
    b.status === 'Rejected' || 
    (b.status === 'Accepted' && b.servicedate < getTodayDate())
  );

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowModal(true);
    setServiceDate(""); 
    setPaymentMethod("Cash"); 
  };

  const handleCancelBooking = async (e, bookingId) => {
    e.stopPropagation(); // Stops click from potentially bubbling
    if (deletingIds.includes(bookingId)) return; // Prevents double click on trash icon

    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    setDeletingIds(prev => [...prev, bookingId]);

    try {
      await api.delete(`resident/bookings/${bookingId}/`);
      alert("Booking cancelled successfully.");
      fetchBookings(); 
      if (currentUserId) fetchBadgeCount(currentUserId);
    } catch (error) {
      console.error("Cancellation failed", error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error);
      } else {
        alert("Failed to cancel booking. Ensure it is not a past date.");
      }
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== bookingId));
    }
  };

  const handleBookService = async () => {
    if (isBooking) return; // Prevent double submit
    if (!serviceDate) {
      alert("Please select a date for the service.");
      return;
    }

    setIsBooking(true);
    try {
      const bookingPayload = {
        serviceid: selectedService.serviceid,
        servicedate: serviceDate,
        payment_method: paymentMethod
      };

      const res = await api.post('resident/bookings/', bookingPayload);

      if (paymentMethod === "Bkash") {
        const bookingId = res.data.bookingid;
        const payRes = await api.post('payment/bkash/initiate/', { booking_id: bookingId });
        
        if (payRes.data.payment_url) {
            window.location.href = payRes.data.payment_url;
            return;
        } else {
            alert("Failed to initiate bKash payment.");
            setIsBooking(false);
            return;
        }
      }

      alert("Service requested! Waiting for provider approval.");
      setShowModal(false);
      fetchBookings(); 
      if (currentUserId) fetchBadgeCount(currentUserId);

    } catch (error) {
      console.error("Booking failed", error);
      if (error.response && error.response.data && error.response.data[0]) {
          alert(error.response.data[0]); 
      } else {
          alert("Failed to book service. Please try again.");
      }
    } finally {
      if (paymentMethod !== "Bkash") {
        setIsBooking(false);
      }
    }
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const renderBookingList = (list, emptyMessage, isHistory = false) => (
    <div className="bookings-list">
      {list.length > 0 ? (
        list.map((booking) => (
          <div key={booking.bookingid} className="booking-card mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">{booking.service_name}</h5>
                <p className="text-muted mb-1 small">
                  <Calendar size={14} className="me-1"/> Service Date: {booking.servicedate}
                </p>
                <p className="text-muted mb-0 small">
                  <User size={14} className="me-1"/> Provider: {booking.provider_name}
                </p>
              </div>
              <div className="text-end">
                <h6 className="mb-2">${booking.price}</h6>
                <div className="d-flex align-items-center gap-2 justify-content-end">
                  <Badge bg={
                    booking.status === 'Accepted' ? 'success' : 
                    booking.status === 'Pending' ? 'warning' : 
                    booking.status === 'Rejected' ? 'danger' : 'secondary'
                  }>
                    {booking.status}
                  </Badge>
                  
                  {!isHistory && (
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="p-1 border-0"
                      onClick={(e) => handleCancelBooking(e, booking.bookingid)}
                      title="Cancel Booking"
                      disabled={deletingIds.includes(booking.bookingid)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-muted py-5">
          {emptyMessage}
        </div>
      )}
    </div>
  );

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
        <div className="page-header">
          <div className="page-title">
            <h1>Services</h1>
            <div className="page-subtitle">Find and book community professionals</div>
          </div>
        </div>
        <Tabs defaultActiveKey="browse" id="service-tabs" className="mb-4 custom-tabs">
          <Tab eventKey="browse" title="Browse Services">
            <div className="search-wrapper mb-4">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search by service name or category..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="row g-4">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <div className="col-md-6 col-lg-4" key={service.serviceid}>
                    <div className="service-card" onClick={() => handleServiceClick(service)}>
                      <div className="service-header">
                        <h5 className="service-title">{service.servicename}</h5>
                        <Badge bg={service.availability ? "success" : "secondary"}>
                          {service.availability ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                      <div className="service-body">
                        <p className="service-category text-muted">{service.category}</p>
                        <h6 className="service-price">${service.price}</h6>
                        <p className="service-provider text-muted small">
                          Provider: {service.provider_name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center text-muted py-5">
                  No services found matching "{searchTerm}"
                </div>
              )}
            </div>
          </Tab>
          
          <Tab eventKey="requested" title="Requested Bookings">
            {renderBookingList(requestedBookings, "You have no pending requests.")}
          </Tab>

          <Tab eventKey="upcoming" title="Upcoming Bookings">
            {renderBookingList(upcomingBookings, "You have no upcoming confirmed bookings.")}
          </Tab>

          <Tab eventKey="history" title="Booking History">
             {renderBookingList(historyBookings, "No booking history found.", true)}
          </Tab>
        </Tabs>
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          {selectedService && (
            <>
              <Modal.Header closeButton>
                <Modal.Title>{selectedService.servicename}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="mb-3">
                  <Badge bg={selectedService.availability ? "success" : "danger"} className="mb-2">
                    {selectedService.availability ? "Available for Booking" : "Currently Unavailable"}
                  </Badge>
                  <p className="text-muted">{selectedService.description || "No description provided."}</p>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <strong>Price:</strong>
                    <span>${selectedService.price}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <strong>Provider:</strong>
                    <span>{selectedService.provider_name}</span>
                  </div>
                </div>
                {selectedService.availability && (
                  <div className="booking-form-section bg-light p-3 rounded">
                    <h6 className="mb-3">Book This Service</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Service Date</Form.Label>
                      <Form.Control 
                        type="date" 
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]} 
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Method</Form.Label>
                      <div className="d-flex gap-3">
                        <Form.Check 
                          type="radio"
                          label="Cash on Delivery"
                          name="paymentMethod"
                          checked={paymentMethod === "Cash"}
                          onChange={() => setPaymentMethod("Cash")}
                        />
                        <Form.Check 
                          type="radio"
                          label="Bkash"
                          name="paymentMethod"
                          checked={paymentMethod === "Bkash"}
                          onChange={() => setPaymentMethod("Bkash")}
                        />
                      </div>
                    </Form.Group>
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Close
                </Button>
                {selectedService.availability && (
                  <Button variant="dark" onClick={handleBookService} disabled={isBooking}>
                    {isBooking ? "Requesting..." : "Confirm Request"}
                  </Button>
                )}
              </Modal.Footer>
            </>
          )}
        </Modal>
      </main>
    </div>
  );
};
export default BookService;
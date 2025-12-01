// frontend/src/pages/BookService/BookService.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, 
  Search, User, MapPin, Clock, CreditCard, X, CheckCircle
} from "lucide-react";
import { Modal, Button, Form, Badge, Tabs, Tab } from "react-bootstrap";
import "./BookService.css"; // Ensure you have this CSS file
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

// --- Main Page Component ---
const BookService = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Booking Form State
  const [serviceDate, setServiceDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isBooking, setIsBooking] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    fetchServices();
    fetchBookings();
  }, []);

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

  // 2. Search Logic
  const filteredServices = services.filter(service => 
    service.servicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. Handle Service Click
  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowModal(true);
    setServiceDate(""); // Reset date
    setPaymentMethod("Cash"); // Reset payment
  };

  // 4. Handle Booking Submission
  const handleBookService = async () => {
    if (!serviceDate) {
      alert("Please select a date for the service.");
      return;
    }

    setIsBooking(true);
    try {
      await api.post('resident/bookings/', {
        serviceid: selectedService.serviceid,
        servicedate: serviceDate,
        payment_method: paymentMethod
      });
      
      alert("Service booked successfully!");
      setShowModal(false);
      fetchBookings(); // Refresh booking list
    } catch (error) {
      console.error("Booking failed", error);
      alert("Failed to book service. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        
        <div className="page-header">
          <div className="page-title">
            <h1>Services</h1>
            <div className="page-subtitle">Find and book community professionals</div>
          </div>
        </div>

        <Tabs defaultActiveKey="browse" id="service-tabs" className="mb-4 custom-tabs">
          
          {/* --- Tab 1: Browse Services --- */}
          <Tab eventKey="browse" title="Browse Services">
            {/* Search Bar */}
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

            {/* Services Grid */}
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

          {/* --- Tab 2: My Bookings --- */}
          <Tab eventKey="bookings" title="My Bookings">
            <div className="bookings-list">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
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
                        <h6 className="mb-1">${booking.price}</h6>
                        <Badge bg={booking.status === 'Completed' ? 'success' : 'warning'}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-5">
                  You haven't booked any services yet.
                </div>
              )}
            </div>
          </Tab>
        </Tabs>

        {/* --- Booking Modal --- */}
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

                {/* Booking Form (Only if Available) */}
                {selectedService.availability && (
                  <div className="booking-form-section bg-light p-3 rounded">
                    <h6 className="mb-3">Book This Service</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Service Date</Form.Label>
                      <Form.Control 
                        type="date" 
                        value={serviceDate}
                        onChange={(e) => setServiceDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]} // Prevent past dates
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
                    {isBooking ? "Booking..." : "Confirm Booking"}
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
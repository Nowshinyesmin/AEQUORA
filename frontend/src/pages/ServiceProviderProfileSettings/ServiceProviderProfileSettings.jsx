import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    Grid, 
    Calendar, 
    Briefcase, 
    Star, 
    User, 
    LogOut, 
    Save,
    Camera,
    MapPin,
    Mail,
    Phone,
    Clock,
    DollarSign
} from 'lucide-react';
import { Container, Row, Col, Form, Button, Card, Spinner, Alert, Image } from 'react-bootstrap';
import './ServiceProviderProfileSettings.css';
import { api } from "../../api/client"; 

// --- Internal Sidebar Component ---
const Sidebar = ({ handleLogout }) => {
    const location = useLocation();
    
    const navLinks = [
        { to: '/serviceprovider/dashboard', icon: Grid, label: 'Dashboard' },
        { to: '/serviceprovider/bookings', icon: Calendar, label: 'Manage Bookings' },
        { to: '/serviceprovider/services', icon: Briefcase, label: 'My Services' },
        { to: '/serviceprovider/reviews', icon: Star, label: 'Reviews' },
        { to: '/serviceprovider/profile', icon: User, label: 'Profile Settings' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-brand">
                Aequora
            </div>
            
            <nav className="sidebar-nav">
                {navLinks.map((link) => {
                    const active = isActive(link.to);
                    return (
                        <Link 
                            key={link.to} 
                            to={link.to} 
                            className={`nav-item ${active ? 'active' : ''}`}
                        >
                            <link.icon className="nav-icon" size={20} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-button" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

// --- Main Profile Settings Component ---
const ServiceProviderProfileSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // State mapped to models.py
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        profileImage: '', 
        serviceCategory: '',
        experienceYears: 0,
        hourlyRate: 0.00,
        bio: '',
        availabilityStatus: 'Available', 
        city: '',
        postalCode: ''
    });

    const handleLogout = () => {
        localStorage.removeItem('access'); 
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    // Helper to handle broken images
    const handleImageError = (e) => {
        e.target.onerror = null; 
        e.target.src = `https://ui-avatars.com/api/?name=${formData.firstName || 'User'}+${formData.lastName || ''}&background=random&color=fff`;
    };

    // --- Fetch Profile Data ---
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/service-provider/profile/');
                const data = response.data;
                
                setFormData({
                    firstName: data.firstname || '',
                    lastName: data.lastname || '',
                    email: data.email || '',
                    phoneNumber: data.phonenumber || '',
                    profileImage: data.profileimage || '',
                    
                    serviceCategory: data.servicecategory || '',
                    experienceYears: data.experienceyears || 0,
                    hourlyRate: data.hourlyrate || 0,
                    bio: data.bio || '',
                    availabilityStatus: data.availabilitystatus || 'Available',
                    
                    city: data.city || '',
                    postalCode: data.postalcode || ''
                });
            } catch (error) {
                console.error("Failed to fetch profile", error);
                setMessage({ type: 'danger', text: 'Could not load profile data.' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await api.put('/service-provider/profile/', formData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Update failed", error);
            setMessage({ type: 'danger', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-root d-flex justify-content-center align-items-center">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="dashboard-root">
            <Sidebar handleLogout={handleLogout} />

            <main className="dashboard-main">
                <Container fluid className="py-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="h3 fw-bold text-gray-800">Profile Settings</h1>
                            <p className="text-muted">Manage your personal information and service details</p>
                        </div>
                    </div>

                    {message.text && (
                        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
                            {message.text}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            {/* Left Column: Visual Profile Card */}
                            <Col lg={4} className="mb-4">
                                <Card className="border-0 shadow-sm profile-card-side h-100">
                                    <Card.Body className="text-center pt-5 pb-4">
                                        <div className="position-relative d-inline-block mb-3">
                                            <Image 
                                                src={
                                                    formData.profileImage 
                                                    ? formData.profileImage 
                                                    : `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=0D8ABC&color=fff`
                                                } 
                                                roundedCircle 
                                                className="profile-avatar mb-3"
                                                alt="Profile"
                                                onError={handleImageError}
                                            />
                                            <div className="avatar-edit-overlay">
                                                <Camera size={18} className="text-white" />
                                            </div>
                                        </div>
                                        <h4 className="fw-bold mb-1">{formData.firstName} {formData.lastName}</h4>
                                        <p className="text-muted mb-2">{formData.serviceCategory || "Service Provider"}</p>
                                        
                                        <div className="d-flex justify-content-center gap-2 mb-4">
                                            <span className={`status-badge ${formData.availabilityStatus.toLowerCase()}`}>
                                                {formData.availabilityStatus}
                                            </span>
                                        </div>

                                        <hr className="my-4" />

                                        <div className="info-list text-start px-2">
                                            <div className="info-item mb-3 d-flex align-items-center">
                                                <Mail size={18} className="text-primary me-3" />
                                                <span className="text-sm text-dark">{formData.email}</span>
                                            </div>
                                            <div className="info-item mb-3 d-flex align-items-center">
                                                <Phone size={18} className="text-primary me-3" />
                                                <span className="text-sm text-dark">{formData.phoneNumber}</span>
                                            </div>
                                            <div className="info-item d-flex align-items-center">
                                                <MapPin size={18} className="text-primary me-3" />
                                                <span className="text-sm text-dark">{formData.city || "Location not set"}</span>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Right Column: Edit Details Form */}
                            <Col lg={8}>
                                <Card className="border-0 shadow-sm mb-4">
                                    <Card.Header className="bg-white py-3 border-bottom-0">
                                        <h5 className="mb-0 fw-bold text-dark">Personal Information</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">First Name</Form.Label>
                                                    <Form.Control 
                                                        type="text" 
                                                        name="firstName"
                                                        value={formData.firstName} 
                                                        onChange={handleChange}
                                                        className="form-control-custom"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">Last Name</Form.Label>
                                                    <Form.Control 
                                                        type="text" 
                                                        name="lastName"
                                                        value={formData.lastName} 
                                                        onChange={handleChange}
                                                        className="form-control-custom"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">Email Address</Form.Label>
                                                    <Form.Control 
                                                        type="email" 
                                                        name="email"
                                                        value={formData.email} 
                                                        disabled 
                                                        className="form-control-custom bg-light"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">Phone Number</Form.Label>
                                                    <Form.Control 
                                                        type="text" 
                                                        name="phoneNumber"
                                                        value={formData.phoneNumber} 
                                                        onChange={handleChange}
                                                        className="form-control-custom"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Card className="border-0 shadow-sm">
                                    <Card.Header className="bg-white py-3 border-bottom-0">
                                        <h5 className="mb-0 fw-bold text-dark">Service Details</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">Service Category</Form.Label>
                                                    <Form.Select 
                                                        name="serviceCategory"
                                                        value={formData.serviceCategory}
                                                        onChange={handleChange}
                                                        className="form-control-custom"
                                                    >
                                                        <option value="">Select Category</option>
                                                        <option value="Plumbing">Plumbing</option>
                                                        <option value="Electrical">Electrical</option>
                                                        <option value="Cleaning">Cleaning</option>
                                                        <option value="Carpentry">Carpentry</option>
                                                        <option value="Appliance Repair">Appliance Repair</option>
                                                        <option value="Pest Control">Pest Control</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">Availability Status</Form.Label>
                                                    <Form.Select 
                                                        name="availabilityStatus"
                                                        value={formData.availabilityStatus}
                                                        onChange={handleChange}
                                                        className="form-control-custom"
                                                    >
                                                        <option value="Available">Available</option>
                                                        <option value="Busy">Busy</option>
                                                        <option value="Offline">Offline</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">
                                                        <Clock size={14} className="me-1"/> Experience (Years)
                                                    </Form.Label>
                                                    <Form.Control 
                                                        type="number" 
                                                        name="experienceYears"
                                                        value={formData.experienceYears} 
                                                        onChange={handleChange}
                                                        className="form-control-custom"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">
                                                        <DollarSign size={14} className="me-1"/> Hourly Rate (Tk)
                                                    </Form.Label>
                                                    <Form.Control 
                                                        type="number" 
                                                        name="hourlyRate"
                                                        value={formData.hourlyRate} 
                                                        onChange={handleChange}
                                                        className="form-control-custom"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">Bio / Description</Form.Label>
                                                    <Form.Control 
                                                        as="textarea" 
                                                        rows={4}
                                                        name="bio"
                                                        value={formData.bio} 
                                                        onChange={handleChange}
                                                        className="form-control-custom"
                                                        placeholder="Describe your services, skills, and why clients should hire you..."
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <div className="mt-4 d-flex justify-content-end">
                                            <Button 
                                                type="submit" 
                                                className="save-btn px-4 py-2 d-flex align-items-center gap-2"
                                                disabled={saving}
                                            >
                                                {saving ? (
                                                    <Spinner size="sm" animation="border" />
                                                ) : (
                                                    <>
                                                        <Save size={18} /> Save Changes
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Form>
                </Container>
            </main>
        </div>
    );
}

export default ServiceProviderProfileSettings;
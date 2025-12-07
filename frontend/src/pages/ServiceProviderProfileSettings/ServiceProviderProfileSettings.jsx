import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    Grid, Calendar, Briefcase, Star, User, LogOut, Save,
    Phone, Map, FileText, CalendarDays, Users, Home, Clock
} from 'lucide-react';
import { Container, Row, Col, Form, Button, Card, Spinner, Alert, Image } from 'react-bootstrap';
import './ServiceProviderProfileSettings.css'; 
import { api } from "../../api/client"; 

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
            <div className="sidebar-brand">Aequora</div>
            <nav className="sidebar-nav">
                {navLinks.map((link) => (
                    <Link 
                        key={link.to} 
                        to={link.to} 
                        className={`nav-item ${isActive(link.to) ? 'active' : ''}`}
                    >
                        <link.icon size={20} />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

const ServiceProviderProfileSettings = () => {
    const navigate = useNavigate(); // Hook for navigation
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [communities, setCommunities] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentFileUrl, setCurrentFileUrl] = useState(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',   
        date_of_birth: '', 
        gender: '',        
        community_id: '',
        sub_role: '',             
        service_area: '',        
        working_hours: '',        
        availability_status: 'Available', 
    });

    // --- Logout Logic ---
    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    const handleImageError = (e) => {
        e.target.onerror = null; 
        e.target.src = `https://ui-avatars.com/api/?name=${formData.first_name || 'User'}+${formData.last_name || ''}&background=random&color=fff`;
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data: profileData } = await api.get('/provider/profile/');
                const { data: communitiesData } = await api.get('/communities/');
                setCommunities(communitiesData);

                setFormData({
                    first_name: profileData.first_name || '',
                    last_name: profileData.last_name || '',
                    phone_number: profileData.phone_number || '',
                    date_of_birth: profileData.date_of_birth || '',
                    gender: profileData.gender || '',
                    community_id: profileData.community_id || '',
                    sub_role: profileData.subrole || '', 
                    service_area: profileData.service_area || '',
                    working_hours: profileData.workinghours || '', 
                    availability_status: profileData.availability_status || 'Available',
                });
                
                if (profileData.certificationfile) {
                    setCurrentFileUrl(profileData.certificationfile);
                }

            } catch (error) {
                console.error("Failed to fetch data", error);
                setMessage({ type: 'danger', text: 'Could not load profile.' });
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        const dataToSend = new FormData();
        
        dataToSend.append('first_name', formData.first_name);
        dataToSend.append('last_name', formData.last_name);
        dataToSend.append('phone_number', formData.phone_number);
        dataToSend.append('gender', formData.gender);
        
        if(formData.date_of_birth) dataToSend.append('date_of_birth', formData.date_of_birth);
        if(formData.community_id) dataToSend.append('community_id', formData.community_id);

        dataToSend.append('subrole', formData.sub_role);
        dataToSend.append('service_area', formData.service_area);
        dataToSend.append('workinghours', formData.working_hours);
        dataToSend.append('availability_status', formData.availability_status);

        if (selectedFile) {
            dataToSend.append('certificationfile', selectedFile);
        }

        try {
            await api.put('/provider/profile/', dataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setSelectedFile(null);
        } catch (error) {
            console.error("Update failed", error);
            setMessage({ type: 'danger', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" variant="primary" /></div>;
    }

    return (
        <div className="dashboard-layout">
            {/* Pass handleLogout here */}
            <Sidebar handleLogout={handleLogout} />

            <main className="dashboard-main">
                <Container fluid>
                    <div className="dashboard-header mb-4">
                        <h2 className="mb-1">Profile Settings</h2>
                        <p className="text-muted">Manage your personal information and service details</p>
                    </div>

                    {message.text && (
                        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
                            {message.text}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col lg={4} className="mb-4">
                                <Card className="border-0 shadow-sm h-100">
                                    <Card.Body className="text-center pt-5 pb-4">
                                        <div className="position-relative d-inline-block mb-3">
                                            <Image 
                                                src={`https://ui-avatars.com/api/?name=${formData.first_name}+${formData.last_name}&background=0D8ABC&color=fff`} 
                                                roundedCircle 
                                                className="mb-3 border border-3 border-white shadow-sm"
                                                alt="Profile"
                                                onError={handleImageError}
                                                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <h4 className="fw-bold mb-1">{formData.first_name} {formData.last_name}</h4>
                                        <p className="text-muted mb-2">{formData.sub_role || "Service Provider"}</p>
                                        
                                        <div className="d-flex justify-content-center gap-2 mb-4">
                                            <span className={`badge ${formData.availability_status === 'Available' ? 'bg-success' : 'bg-secondary'}`}>
                                                {formData.availability_status}
                                            </span>
                                        </div>

                                        <hr className="my-4" />

                                        <div className="text-start px-2">
                                            <div className="mb-3 d-flex align-items-center">
                                                <Phone size={18} className="text-primary me-3" />
                                                <span className="text-dark">{formData.phone_number || 'No phone'}</span>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

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
                                                    <Form.Control type="text" name="first_name" value={formData.first_name} onChange={handleChange} />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">Last Name</Form.Label>
                                                    <Form.Control type="text" name="last_name" value={formData.last_name} onChange={handleChange} />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted"><CalendarDays size={14} className="me-1"/> Date of Birth</Form.Label>
                                                    <Form.Control type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted"><Users size={14} className="me-1"/> Gender</Form.Label>
                                                    <Form.Select name="gender" value={formData.gender} onChange={handleChange}>
                                                        <option value="">Select Gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">Phone Number</Form.Label>
                                                    <Form.Control type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} />
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
                                            <Col md={12}>
                                                <Form.Group className="bg-light p-3 rounded border border-primary-subtle">
                                                    <Form.Label className="small fw-bold text-primary">
                                                        <Home size={14} className="me-1"/> Community (Required)
                                                    </Form.Label>
                                                    <Form.Select 
                                                        name="community_id"
                                                        value={formData.community_id}
                                                        onChange={handleChange}
                                                        className="form-select-custom border-primary"
                                                    >
                                                        <option value="">Select a Community</option>
                                                        {communities.map(comm => (
                                                            <option key={comm.communityid} value={comm.communityid}>
                                                                {comm.name} (ID: {comm.communityid})
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>

                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">Sub Role / Category</Form.Label>
                                                    <Form.Control type="text" name="sub_role" value={formData.sub_role} onChange={handleChange} placeholder="e.g. Plumber" />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">Availability Status</Form.Label>
                                                    <Form.Select name="availability_status" value={formData.availability_status} onChange={handleChange}>
                                                        <option value="Available">Available</option>
                                                        <option value="Busy">Busy</option>
                                                        <option value="Offline">Offline</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted"><Map size={14} className="me-1"/> Service Area</Form.Label>
                                                    <Form.Control type="text" name="service_area" value={formData.service_area} onChange={handleChange} />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted"><Clock size={14} className="me-1"/> Working Hours</Form.Label>
                                                    <Form.Control type="text" name="working_hours" value={formData.working_hours} onChange={handleChange} />
                                                </Form.Group>
                                            </Col>
                                            
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold text-muted">
                                                        <FileText size={14} className="me-1"/> Certification File
                                                    </Form.Label>
                                                    <Form.Control 
                                                        type="file" 
                                                        onChange={handleFileChange}
                                                    />
                                                    {currentFileUrl && !selectedFile && (
                                                        <div className="mt-2 text-sm text-success small">
                                                            ✓ Current file uploaded (Hidden for security)
                                                        </div>
                                                    )}
                                                    <Form.Text className="text-muted">Upload PDF or Image of your certification.</Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        <div className="mt-4 d-flex justify-content-end">
                                            <Button type="submit" className="save-btn px-4 py-2 d-flex align-items-center gap-2" disabled={saving}>
                                                {saving ? <Spinner size="sm" animation="border" /> : <><Save size={18} /> Save Changes</>}
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
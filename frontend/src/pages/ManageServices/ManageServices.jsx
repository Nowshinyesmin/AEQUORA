import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
    Grid, 
    Calendar, 
    Briefcase, 
    Star, 
    User, 
    Plus, 
    Edit2, 
    Trash2, 
    LogOut,
    CheckCircle,
    XCircle,
    Briefcase as ServiceIcon
} from 'lucide-react';
import { 
    Container, 
    Table, 
    Button, 
    Modal, 
    Form, 
    Spinner, 
    Card,
    Badge,
    Alert,
    Row,
    Col
} from 'react-bootstrap';
import { api } from "../../api/client"; 
import './ManageServices.css';

// --- Sidebar Component ---
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
            <div className="user-profile-section">
                <div className="profile-avatar-sp">
                    <Briefcase size={28} />
                </div>
                <div className="user-name">My Services</div>
                <div className="user-role">Service Management</div>
            </div>
            <nav className="sidebar-nav">
                {navLinks.map((link) => (
                    <Link 
                        key={link.to} 
                        to={link.to} 
                        className={`nav-item ${isActive(link.to) ? 'active' : ''}`}
                    >
                        <link.icon size={20} className="nav-icon" />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} style={{ marginRight: '8px' }} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

const ManageServices = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentServiceId, setCurrentServiceId] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Form State (Strings for inputs to handle React state properly)
    const [formData, setFormData] = useState({
        servicename: '',
        price: '',
        description: '',
        availability: 'true' // Controls the dropdown (string value)
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await api.get('/provider/services/');
            // Safety check: Ensure we map over an array
            if (Array.isArray(response.data)) {
                setServices(response.data);
            } else {
                setServices([]); 
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching services", error);
            setErrorMsg("Failed to load services.");
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    // --- Helper for Availability Badge ---
    const getAvailabilityBadge = (avail) => {
        // Handle various true/false formats safely
        // Database might return boolean true/false, or string "true"/"false", or 1/0
        const isTrue = avail === true || String(avail).toLowerCase() === 'true' || avail === 1;
        
        if (isTrue) {
            return (
                <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                    <CheckCircle size={12} /> Available
                </Badge>
            );
        } else {
            return (
                <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
                    <XCircle size={12} /> Unavailable
                </Badge>
            );
        }
    };

    // --- Modal Handlers ---
    const handleAddNew = () => {
        setFormData({ servicename: '', price: '', description: '', availability: 'true' });
        setIsEditing(false);
        setCurrentServiceId(null);
        setShowModal(true);
        setErrorMsg('');
    };

    const handleEdit = (service) => {
        setFormData({
            servicename: service.servicename,
            price: service.price,
            description: service.description,
            // Convert database value to string for dropdown
            availability: (service.availability === true || String(service.availability) === 'true') ? 'true' : 'false'
        });
        setCurrentServiceId(service.serviceid);
        setIsEditing(true);
        setShowModal(true);
        setErrorMsg('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this service?")) return;

        try {
            await api.delete(`/provider/services/${id}/`);
            setServices(services.filter(s => s.serviceid !== id));
        } catch (error) {
            console.error("Error deleting service", error);
            alert("Failed to delete service.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setErrorMsg('');

        // 1. Construct Payload Explicitly
        // This ensures 'availability' is a real Boolean, not a string
        const payload = {
            servicename: formData.servicename,
            price: formData.price,
            description: formData.description,
            availability: formData.availability === 'true' // Converts string "true" -> true
        };

        try {
            if (isEditing) {
                // UPDATE (PUT)
                const response = await api.put(`/provider/services/${currentServiceId}/`, payload);
                setServices(services.map(s => s.serviceid === currentServiceId ? response.data : s));
            } else {
                // CREATE (POST)
                const response = await api.post('/provider/services/', payload);
                setServices([...services, response.data]);
            }
            setShowModal(false);
        } catch (error) {
            console.error("Error saving service", error);
            // Display specific backend error if available
            const backendData = error.response?.data;
            let displayError = "Failed to save service.";
            
            if (backendData) {
                // Check for generic error or field errors
                if (backendData.error) {
                    displayError = backendData.error;
                } else {
                    // Format Django field errors (e.g. {price: ["A number is required"]})
                    displayError = Object.entries(backendData)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(', ');
                }
            }
            setErrorMsg(displayError);
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <Spinner animation="border" variant="primary" />
        </div>
    );

    return (
        <div className="dashboard-root">
            <Sidebar handleLogout={handleLogout} />

            <main className="main-content">
                <Container fluid>
                    <div className="d-flex justify-content-between align-items-center mb-4 header-welcome">
                        <div>
                            <h1>My Services</h1>
                            <p>Create and manage the services residents can book.</p>
                        </div>
                        <Button 
                            className="d-flex align-items-center gap-2 btn-primary-custom"
                            onClick={handleAddNew}
                        >
                            <Plus size={18} /> Add New Service
                        </Button>
                    </div>

                    {errorMsg && <Alert variant="danger" dismissible onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

                    <Card className="border-0 shadow-sm table-card">
                        <Card.Body className="p-0">
                            <Table hover responsive className="custom-table align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th style={{width: '25%'}}>Service Name</th>
                                        <th style={{width: '35%'}}>Description</th>
                                        <th style={{width: '15%'}}>Price</th>
                                        <th style={{width: '15%'}}>Status</th>
                                        <th className="text-end" style={{width: '10%'}}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services && services.length > 0 ? (
                                        services.map((service) => (
                                            <tr key={service.serviceid}>
                                                <td className="fw-bold text-primary">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <ServiceIcon size={16} className="text-muted" />
                                                        {service.servicename}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-muted small d-inline-block text-truncate" style={{maxWidth: '250px'}}>
                                                        {service.description || "No description provided."}
                                                    </span>
                                                </td>
                                                <td className="fw-bold">${service.price}</td>
                                                <td>
                                                    {getAvailabilityBadge(service.availability)}
                                                </td>
                                                <td className="text-end">
                                                    {/* Flex Container for Buttons to fix alignment */}
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <Button 
                                                            variant="outline-primary" 
                                                            size="sm" 
                                                            onClick={() => handleEdit(service)}
                                                            title="Edit"
                                                            style={{ width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </Button>
                                                        <Button 
                                                            variant="outline-danger" 
                                                            size="sm" 
                                                            onClick={() => handleDelete(service.serviceid)}
                                                            title="Delete"
                                                            style={{ width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5">
                                                <div className="empty-state">
                                                    <div className="mb-3 text-muted opacity-50" style={{fontSize: '2rem'}}>📋</div>
                                                    <h5 className="text-muted">No Services Added</h5>
                                                    <p className="text-muted small">
                                                        Click "Add New Service" to get started.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* Add/Edit Modal */}
                    <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
                        <Modal.Header closeButton>
                            <Modal.Title>{isEditing ? 'Edit Service' : 'Add New Service'}</Modal.Title>
                        </Modal.Header>
                        <Form onSubmit={handleSubmit}>
                            <Modal.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Service Name</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={formData.servicename}
                                        onChange={(e) => setFormData({...formData, servicename: e.target.value})}
                                        required
                                        placeholder="e.g., Plumbing Repair"
                                    />
                                </Form.Group>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Price ($)</Form.Label>
                                            <Form.Control 
                                                type="number" 
                                                step="0.01"
                                                value={formData.price}
                                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                                required
                                                placeholder="0.00"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Status</Form.Label>
                                            <Form.Select 
                                                value={formData.availability}
                                                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                                            >
                                                <option value="true">Available</option>
                                                <option value="false">Unavailable</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Description</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={3} 
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Describe what this service includes..."
                                    />
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => setShowModal(false)} disabled={modalLoading}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" disabled={modalLoading}>
                                    {modalLoading ? <Spinner size="sm" animation="border" /> : (isEditing ? 'Update Service' : 'Create Service')}
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal>
                </Container>
            </main>
        </div>
    );
};

export default ManageServices;
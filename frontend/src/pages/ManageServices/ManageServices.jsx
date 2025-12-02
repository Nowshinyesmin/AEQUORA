// frontend/src/pages/ManageServices/ManageServices.jsx

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
    Search,
    Filter,
    LogOut 
} from 'lucide-react';
import { 
    Container, 
    Row, 
    Col, 
    Table, 
    Button, 
    Modal, 
    Form, 
    Spinner, 
    Card 
} from 'react-bootstrap';

// Importing the API client wrapper
import { api } from "../../api/client"; 

import './ManageServices.css';

// --- Internal Sidebar Component ---
const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Navigation links matching main.jsx
    const navLinks = [
        { to: '/serviceprovider/dashboard', icon: Grid, label: 'Dashboard' },
        { to: '/serviceprovider/bookings', icon: Calendar, label: 'Manage Bookings' },
        { to: '/serviceprovider/services', icon: Briefcase, label: 'My Services' },
        { to: '/serviceprovider/reviews', icon: Star, label: 'Reviews' },
        { to: '/serviceprovider/profile', icon: User, label: 'Profile Settings' },
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        // Clear tokens and redirect
        localStorage.removeItem('token'); 
        navigate('/login');
    };

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-brand">
                Aequora
            </div>
            <nav className="sidebar-nav">
                {navLinks.map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}
                    >
                        <link.icon size={20} className="sidebar-icon" />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>
            
            {/* Logout Button at Bottom */}
            <div className="sidebar-footer mt-auto p-3">
                <button 
                    onClick={handleLogout} 
                    className="sidebar-logout-btn"
                >
                    <LogOut size={20} className="sidebar-icon" />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
};

const ManageServices = () => {
    // --- State Management ---
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentServiceId, setCurrentServiceId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        serviceName: '',
        category: 'Cleaning',
        price: '',
        description: '',
        isActive: true
    });

    // --- API Interactions ---
    const fetchServices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/service-provider/services/');
            setServices(response.data);
        } catch (error) {
            console.error("Error fetching services:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleSaveService = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/service-provider/services/${currentServiceId}/`, formData);
            } else {
                await api.post('/service-provider/services/', formData);
            }
            setShowModal(false);
            fetchServices();
        } catch (error) {
            console.error("Error saving service:", error);
            alert("Operation failed. Check console.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this service permanently?")) {
            try {
                await api.delete(`/service-provider/services/${id}/`);
                fetchServices();
            } catch (error) {
                console.error("Error deleting service:", error);
            }
        }
    };

    const handleToggleStatus = async (service) => {
        try {
            await api.patch(`/service-provider/services/${service.id}/`, {
                isActive: !service.isActive
            });
            fetchServices();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    // --- Modal Helpers ---
    const openAddModal = () => {
        setFormData({ serviceName: '', category: 'Cleaning', price: '', description: '', isActive: true });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (service) => {
        setFormData({
            serviceName: service.serviceName,
            category: service.category,
            price: service.price,
            description: service.description,
            isActive: service.isActive
        });
        setCurrentServiceId(service.id);
        setIsEditing(true);
        setShowModal(true);
    };

    return (
        <div className="dashboard-root">
            <Sidebar />
            
            <main className="dashboard-content">
                <Container fluid className="px-0">
                    {/* Page Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="page-title">Manage Services</h2>
                            <p className="text-muted mb-0">Overview of your service catalog</p>
                        </div>
                        <Button className="btn-primary-custom" onClick={openAddModal}>
                            <Plus size={18} className="me-2" />
                            Add Service
                        </Button>
                    </div>

                    {/* Stats Row */}
                    <Row className="mb-4">
                        <Col md={3}>
                            <div className="stat-card">
                                <span className="stat-label">Total Services</span>
                                <h3 className="stat-value">{services.length}</h3>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="stat-card">
                                <span className="stat-label">Active</span>
                                <h3 className="stat-value text-success">
                                    {services.filter(s => s.isActive).length}
                                </h3>
                            </div>
                        </Col>
                    </Row>

                    {/* Main Content Box (White Background) */}
                    <Card className="service-content-card">
                        <Card.Body className="p-0">
                            {/* Toolbar inside the White Box */}
                            <div className="table-toolbar">
                                <div className="search-box">
                                    <Search size={18} className="text-muted" />
                                    <input type="text" placeholder="Search services..." />
                                </div>
                                <Button variant="outline-secondary" size="sm" className="btn-filter">
                                    <Filter size={16} className="me-2" /> Filter
                                </Button>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                </div>
                            ) : (
                                <Table hover responsive className="mb-0 custom-table">
                                    <thead className="bg-light">
                                        <tr>
                                            <th>Service Name</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Description</th>
                                            <th>Status</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {services.length > 0 ? (
                                            services.map((service) => (
                                                <tr key={service.id}>
                                                    <td className="fw-semibold text-dark">{service.serviceName}</td>
                                                    <td>
                                                        <span className="category-badge">{service.category}</span>
                                                    </td>
                                                    <td className="fw-bold text-dark">${Number(service.price).toFixed(2)}</td>
                                                    <td className="text-muted text-truncate" style={{maxWidth: '250px'}}>
                                                        {service.description}
                                                    </td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input 
                                                                className="form-check-input" 
                                                                type="checkbox" 
                                                                checked={service.isActive}
                                                                onChange={() => handleToggleStatus(service)}
                                                            />
                                                            <label className="form-check-label small ms-2 text-muted">
                                                                {service.isActive ? 'Active' : 'Hidden'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td className="text-end">
                                                        <Button variant="link" className="action-btn text-primary" onClick={() => openEditModal(service)}>
                                                            <Edit2 size={18} />
                                                        </Button>
                                                        <Button variant="link" className="action-btn text-danger" onClick={() => handleDelete(service.id)}>
                                                            <Trash2 size={18} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-5 text-muted">
                                                    No services found. Add one to get started!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Container>
            </main>

            {/* Modal remains the same */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Edit Service' : 'Add New Service'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveService}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Service Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={formData.serviceName}
                                onChange={(e) => setFormData({...formData, serviceName: e.target.value})}
                                required
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    >
                                        <option value="Cleaning">Cleaning</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Appliance">Appliance</option>
                                        <option value="General">General Help</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Price ($)</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={3} 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="btn-primary-custom">
                            {isEditing ? 'Update Service' : 'Create Service'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default ManageServices;
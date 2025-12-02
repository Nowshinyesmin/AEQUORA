// frontend/src/pages/ManageBookings/ManageBookings.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
    Grid, Calendar, Star, Briefcase, User, 
    LogOut, CheckCircle, XCircle, Clock, AlertCircle 
} from 'lucide-react';
import { Container, Table, Button, Badge, Spinner } from 'react-bootstrap';
// This import assumes you have the client.js file in src/api/client.js
import { api } from "../../api/client"; 
import './ManageBookings.css';

// --- Internal Sidebar Component ---
// Replicated exactly from ServiceProviderDashboard.jsx to ensure visual consistency
const Sidebar = ({ handleLogout }) => {
    const location = useLocation();
    
    // Navigation links matching the main.jsx routes
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
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`nav-item ${isActive(link.to) ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-button">
                    <LogOut size={18} />
                    <span>Log Out</span>
                </button>
            </div>
        </aside>
    );
};

const ManageBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    
    const navigate = useNavigate();

    // 1. Fetch Bookings from API
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                // Expected response: List of booking objects matching your Django Serializer
                // Ensure your view returns fields: id, client_name, service_name, scheduled_date, price, status
                const response = await api.get("/service-provider/bookings/");
                setBookings(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching bookings:", err);
                setError("Failed to load bookings. Please check your connection.");
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    // 2. Handle Logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // 3. Handle Status Updates (Accept, Reject, Complete)
    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            // Optimistic UI Update
            setBookings(prevBookings => prevBookings.map(b => 
                b.id === bookingId ? { ...b, status: newStatus } : b
            ));

            // API Call to update status in backend
            await api.patch(`/service-provider/bookings/${bookingId}/update-status/`, {
                status: newStatus
            });
            
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Failed to update status. Please try again.");
            // Revert the optimistic update if necessary
        }
    };

    // 4. Filtering Logic
    const filteredBookings = bookings.filter(booking => {
        if (filterStatus === 'All') return true;
        return booking.status === filterStatus;
    });

    // 5. Status Badge Helper
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': 
                return <Badge bg="warning" text="dark">Pending</Badge>;
            case 'Confirmed': 
                return <Badge bg="primary">Confirmed</Badge>;
            case 'Completed': 
                return <Badge bg="success">Completed</Badge>;
            case 'Cancelled': 
                return <Badge bg="danger">Cancelled</Badge>;
            default: 
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="dashboard-root">
                <Sidebar handleLogout={handleLogout} />
                <main className="main-content d-flex justify-content-center align-items-center">
                    <Spinner animation="border" variant="primary" />
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-root">
            <Sidebar handleLogout={handleLogout} />

            <main className="main-content">
                <Container fluid>
                    {/* Header */}
                    <div className="page-header">
                        <h1 className="page-title">Manage Bookings</h1>
                        <p className="page-subtitle">Track and update your incoming service requests.</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="filter-container">
                        {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((status) => (
                            <button
                                key={status}
                                className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
                                onClick={() => setFilterStatus(status)}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="alert alert-danger d-flex align-items-center mb-4">
                            <AlertCircle size={18} className="me-2" />
                            {error}
                        </div>
                    )}

                    {/* Bookings Table Card - Matches ServiceProviderDashboard CSS */}
                    <div className="table-card">
                        <Table responsive hover className="custom-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Client Name</th>
                                    <th>Service</th>
                                    <th>Date & Time</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td className="text-muted">#{booking.id}</td>
                                            
                                            <td className="fw-bold">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="bg-light rounded-circle p-1">
                                                        <User size={14} className="text-secondary" />
                                                    </div>
                                                    {booking.client_name}
                                                </div>
                                            </td>
                                            
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <Briefcase size={14} className="text-primary" />
                                                    {booking.service_name}
                                                </div>
                                            </td>
                                            
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span className="fw-medium">
                                                        {new Date(booking.scheduled_date).toLocaleDateString()}
                                                    </span>
                                                    <small className="text-muted d-flex align-items-center gap-1">
                                                        <Clock size={10} />
                                                        {new Date(booking.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </small>
                                                </div>
                                            </td>
                                            
                                            <td className="fw-bold text-dark">
                                                ${booking.price}
                                            </td>
                                            
                                            <td>{getStatusBadge(booking.status)}</td>
                                            
                                            <td>
                                                <div className="btn-action-group">
                                                    {/* Actions for Pending Bookings */}
                                                    {booking.status === 'Pending' && (
                                                        <>
                                                            <Button 
                                                                variant="success" 
                                                                size="sm" 
                                                                className="btn-action"
                                                                onClick={() => handleStatusUpdate(booking.id, 'Confirmed')}
                                                            >
                                                                <CheckCircle size={14} /> Accept
                                                            </Button>
                                                            <Button 
                                                                variant="outline-danger" 
                                                                size="sm" 
                                                                className="btn-action"
                                                                onClick={() => handleStatusUpdate(booking.id, 'Cancelled')}
                                                            >
                                                                <XCircle size={14} /> Reject
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* Actions for Confirmed Bookings */}
                                                    {booking.status === 'Confirmed' && (
                                                        <Button 
                                                            variant="primary" 
                                                            size="sm" 
                                                            className="btn-action"
                                                            onClick={() => handleStatusUpdate(booking.id, 'Completed')}
                                                        >
                                                            <CheckCircle size={14} /> Mark Complete
                                                        </Button>
                                                    )}

                                                    {/* No Actions for Completed/Cancelled */}
                                                    {(booking.status === 'Completed' || booking.status === 'Cancelled') && (
                                                        <span className="text-muted small">No actions available</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7">
                                            <div className="empty-state">
                                                <Calendar size={48} className="mb-3 opacity-50" />
                                                <h5>No bookings found</h5>
                                                <p className="mb-0">
                                                    {filterStatus === 'All' 
                                                        ? "You don't have any service requests yet." 
                                                        : `No bookings found with status "${filterStatus}".`}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Container>
            </main>
        </div>
    );
};

export default ManageBookings;
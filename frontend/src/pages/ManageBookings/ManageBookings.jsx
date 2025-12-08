import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
    Grid, Calendar, Star, Briefcase, User, 
    LogOut, Save, RefreshCw 
} from 'lucide-react';
import { Container, Table, Spinner, Form, Button } from 'react-bootstrap';
import { api } from "../../api/client"; 
import './ManageBookings.css';

// --- SIDEBAR (Safe Logout Version) ---
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

    const performLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (handleLogout) {
            handleLogout();
        } else {
            window.location.href = '/login'; 
        }
    };

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
                <button onClick={performLogout} className="logout-button">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

// --- MANAGE BOOKINGS ---
const ManageBookings = ({ handleLogout }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [updating, setUpdating] = useState(null); // Track which ID is updating

    const fetchBookings = async () => {
        try {
            const response = await api.get('/provider/bookings/');
            const mapped = response.data.map(b => ({
                id: b.bookingid,
                client_name: b.resident_name || 'Resident',
                service: b.service_name,
                scheduled_date: b.bookingdate,
                status: b.status,
                payment_status: b.paymentstatus, 
                address: b.resident_address
            }));
            setBookings(mapped);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching bookings", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // 1. Handle Local Dropdown Change
    const handleLocalChange = (id, field, value) => {
        setBookings(prev => prev.map(b => 
            b.id === id ? { ...b, [field]: value } : b
        ));
    };

    // 2. Handle Save to API
    const handleSave = async (id, type) => {
        const booking = bookings.find(b => b.id === id);
        if (!booking) return;

        setUpdating(id); // Show loading state for this row

        try {
            let payload = {};
            
            if (type === 'booking_status') {
                payload = { status: booking.status };
            } else if (type === 'payment_status') {
                // Ensure we send 'paymentstatus' (lowercase) to match the Backend View fix
                payload = { paymentstatus: booking.payment_status }; 
            }

            const response = await api.put(`/provider/bookings/${id}/update/`, payload);
            
            // Verify response data confirms the change
            if (response.status === 200) {
                 // Success logic
                 alert("Update Saved Successfully!");
            }
            
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to save. Please check your connection.");
            fetchBookings(); // Revert changes on error
        } finally {
            setUpdating(null);
        }
    };

    const filteredBookings = filterStatus === 'All' 
        ? bookings 
        : bookings.filter(b => b.status === filterStatus);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <Spinner animation="border" />
        </div>
    );

    return (
        <div className="dashboard-root">
            <Sidebar handleLogout={handleLogout} />
            <main className="main-content">
                <Container fluid className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="d-flex align-items-center gap-3">
                            <h2 className="mb-0">Manage Bookings</h2>
                            <Button variant="light" size="sm" onClick={fetchBookings} title="Refresh Data">
                                <RefreshCw size={16} />
                            </Button>
                        </div>
                        <div className="btn-group">
                            {['All', 'Pending', 'Accepted', 'Completed'].map(status => (
                                <button 
                                    key={status}
                                    className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setFilterStatus(status)}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="table-responsive bg-white rounded shadow-sm">
                        <Table hover className="align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th style={{width: '5%'}}>ID</th>
                                    <th style={{width: '15%'}}>Client</th>
                                    <th style={{width: '20%'}}>Service</th>
                                    <th style={{width: '10%'}}>Date</th>
                                    <th style={{width: '25%'}}>Booking Status</th>
                                    <th style={{width: '25%'}}>Payment Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td>#{booking.id}</td>
                                            <td className="fw-bold">{booking.client_name}</td>
                                            <td>
                                                <div>{booking.service}</div>
                                                <small className="text-muted">{booking.address}</small>
                                            </td>
                                            <td>{new Date(booking.scheduled_date).toLocaleDateString()}</td>
                                            
                                            {/* Booking Status + Save */}
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Form.Select 
                                                        size="sm"
                                                        value={booking.status}
                                                        onChange={(e) => handleLocalChange(booking.id, 'status', e.target.value)}
                                                        className={`status-select border-${
                                                            booking.status === 'Completed' ? 'success' : 
                                                            booking.status === 'Cancelled' ? 'danger' : 'primary'
                                                        }`}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Accepted">Accepted</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </Form.Select>
                                                    <Button 
                                                        variant="outline-success" 
                                                        size="sm"
                                                        onClick={() => handleSave(booking.id, 'booking_status')}
                                                        disabled={updating === booking.id}
                                                    >
                                                        <Save size={16} />
                                                    </Button>
                                                </div>
                                            </td>

                                            {/* Payment Status + Save */}
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Form.Select 
                                                        size="sm"
                                                        value={booking.payment_status || 'Unpaid'}
                                                        onChange={(e) => handleLocalChange(booking.id, 'payment_status', e.target.value)}
                                                    >
                                                        <option value="Unpaid">Unpaid</option>
                                                        <option value="Paid">Paid</option>
                                                        {/* Removed "Refunding" to prevent database errors (limit 8 chars) */}
                                                        <option value="Refunded">Refunded</option>
                                                    </Form.Select>
                                                    <Button 
                                                        variant="outline-success" 
                                                        size="sm"
                                                        onClick={() => handleSave(booking.id, 'payment_status')}
                                                        disabled={updating === booking.id}
                                                    >
                                                        <Save size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5 text-muted">
                                            No bookings found.
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

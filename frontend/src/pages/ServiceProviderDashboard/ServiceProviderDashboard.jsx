import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    Grid, 
    Calendar, 
    Briefcase, 
    Star, 
    User, 
    LogOut, 
    DollarSign, 
    CheckCircle, 
    Clock, 
    AlertCircle,
    XCircle,
    Check
} from 'lucide-react';
import { Container, Row, Col, Table, Badge, Spinner, Button } from 'react-bootstrap';
import './ServiceProviderDashboard.css';
import { api } from "../../api/client"; 

// --- Internal Sidebar Component (Your Custom Design) ---
const Sidebar = ({ userInfo, handleLogout }) => {
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
            {/* Top: Brand */}
            <div className="sidebar-brand">Aequora</div>
            
            {/* Top: Profile */}
            <div className="user-profile-section">
                <div className="profile-avatar-sp">
                    <User size={32} />
                </div>
                <div className="user-name">
                    {userInfo?.first_name || 'Service'} {userInfo?.last_name || 'Provider'}
                </div>
                <div className="user-role">Service Partner</div>
            </div>

            {/* Middle: Navigation */}
            <nav className="nav-links">
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

            {/* Bottom: Footer with Logout */}
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} style={{ marginRight: '8px' }} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

// --- Main Dashboard Component ---
function ServiceProviderDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({ first_name: '', last_name: '' });
    
    // State to hold dashboard data from API
    const [dashboardData, setDashboardData] = useState({
        totalEarnings: 0,
        totalBookingsCount: 0,
        completedServicesCount: 0,
        averageRating: 0.0,
        recentBookings: [] 
    });

    // --- API Data Fetching ---
    const fetchDashboardData = async () => {
        try {
            // 1. Fetch User Info
            const profileRes = await api.get('/provider/profile/');
            setUserInfo({
                first_name: profileRes.data.first_name,
                last_name: profileRes.data.last_name
            });

            // 2. Fetch Stats & Recent Bookings
            const dashRes = await api.get('/provider/dashboard/');
            
            setDashboardData({
                totalEarnings: dashRes.data.earnings || 0,
                totalBookingsCount: dashRes.data.total_bookings || 0,
                completedServicesCount: dashRes.data.completed_bookings || 0,
                averageRating: dashRes.data.rating || 0,
                recentBookings: dashRes.data.recent_bookings || []
            });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    // --- Action Handlers (Accept/Decline) ---
    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            await api.put(`/provider/bookings/${bookingId}/update/`, { status: newStatus });
            // Refresh data to show updated status
            fetchDashboardData();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return <span className="status-badge pending"><Clock size={12} /> Pending</span>;
            case 'accepted':
                return <span className="status-badge confirmed"><CheckCircle size={12} /> Accepted</span>;
            case 'completed':
                return <span className="status-badge completed"><CheckCircle size={12} /> Completed</span>;
            case 'cancelled':
                return <span className="status-badge cancelled"><AlertCircle size={12} /> Cancelled</span>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="dashboard-root">
            {/* Sidebar Navigation */}
            <Sidebar userInfo={userInfo} handleLogout={handleLogout} />

            {/* Main Content Area */}
            <main className="main-content">
                <Container fluid>
                    {/* Header */}
                    <div className="header-welcome">
                        <h1>Welcome back, {userInfo.first_name || 'Partner'}!</h1>
                        <p>Here is what’s happening with your services today.</p>
                    </div>

                    {/* Stats Grid */}
                    <Row className="g-4 mb-4">
                        {/* Earnings Card */}
                        <Col md={6} xl={3}>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-title">Total Earnings</span>
                                    <span className="stat-value">${dashboardData.totalEarnings}</span>
                                </div>
                                <div className="stat-icon-wrapper bg-green-light">
                                    <DollarSign size={24} />
                                </div>
                            </div>
                        </Col>

                        {/* Total Bookings Card */}
                        <Col md={6} xl={3}>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-title">Total Bookings</span>
                                    <span className="stat-value">{dashboardData.totalBookingsCount}</span>
                                </div>
                                <div className="stat-icon-wrapper bg-blue-light">
                                    <Calendar size={24} />
                                </div>
                            </div>
                        </Col>

                        {/* Completed Jobs Card */}
                        <Col md={6} xl={3}>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-title">Completed Jobs</span>
                                    <span className="stat-value">{dashboardData.completedServicesCount}</span>
                                </div>
                                <div className="stat-icon-wrapper bg-purple-light">
                                    <Briefcase size={24} />
                                </div>
                            </div>
                        </Col>

                        {/* Rating Card */}
                        <Col md={6} xl={3}>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-title">My Rating</span>
                                    <span className="stat-value">
                                        {dashboardData.averageRating} <span style={{fontSize: '1rem', color:'#fbbf24'}}>★</span>
                                    </span>
                                </div>
                                <div className="stat-icon-wrapper bg-yellow-light">
                                    <Star size={24} />
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Recent Bookings Table */}
                    <div className="table-card">
                        <div className="section-header">
                            <h2 className="section-title">Recent Booking Requests</h2>
                            <Link to="/serviceprovider/bookings">
                                <Button variant="outline-dark" size="sm">View All</Button>
                            </Link>
                        </div>

                        <Table responsive hover className="custom-table align-middle">
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Client Name</th>
                                    <th>Service Type</th>
                                    <th>Date Scheduled</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardData.recentBookings && dashboardData.recentBookings.length > 0 ? (
                                    dashboardData.recentBookings.map((booking) => (
                                        <tr key={booking.bookingid}>
                                            <td>#{booking.bookingid}</td>
                                            <td className="fw-bold">
                                                {booking.resident_name} {booking.resident_lastname}
                                            </td>
                                            <td>{booking.service_name}</td>
                                            <td>{new Date(booking.bookingdate).toLocaleDateString()}</td>
                                            <td>${booking.price}</td>
                                            <td>{getStatusBadge(booking.status)}</td>
                                            <td className="text-end">
                                                {booking.status === 'Pending' && (
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <Button 
                                                            variant="success" 
                                                            size="sm" 
                                                            className="p-1 rounded-circle d-flex align-items-center justify-content-center"
                                                            style={{width: '32px', height: '32px'}}
                                                            onClick={() => handleStatusUpdate(booking.bookingid, 'Accepted')}
                                                            title="Accept Booking"
                                                        >
                                                            <Check size={16} />
                                                        </Button>
                                                        <Button 
                                                            variant="danger" 
                                                            size="sm"
                                                            className="p-1 rounded-circle d-flex align-items-center justify-content-center"
                                                            style={{width: '32px', height: '32px'}}
                                                            onClick={() => handleStatusUpdate(booking.bookingid, 'Cancelled')}
                                                            title="Decline Booking"
                                                        >
                                                            <XCircle size={16} />
                                                        </Button>
                                                    </div>
                                                )}
                                                {booking.status !== 'Pending' && (
                                                    <span className="text-muted small">No actions</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            No recent bookings found.
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
}

export default ServiceProviderDashboard;
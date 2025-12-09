import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
    Grid, 
    Calendar, 
    Briefcase, 
    Star, 
    User, 
    LogOut, 
    MessageSquare,
    ThumbsUp,
    Filter,
    X
} from 'lucide-react';
import { Container, Row, Col, Table, Badge, Spinner, Button, Form, Card } from 'react-bootstrap';
import { api } from "../../api/client"; 
import './CustomerReviews.css';

// --- Internal Sidebar Component ---
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
            <div className="sidebar-brand">Aequora</div>
            
            <div className="user-profile-section">
                <div className="profile-avatar-sp">
                    <User size={32} />
                </div>
                <div className="user-name">
                    {userInfo?.first_name || 'Service'} {userInfo?.last_name || 'Provider'}
                </div>
                <div className="user-role">Service Partner</div>
            </div>

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

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} style={{ marginRight: '8px' }} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

const CustomerReviews = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState({ first_name: '', last_name: '' });
    
    // Data States
    const [reviews, setReviews] = useState([]);
    const [servicesList, setServicesList] = useState([]); // NEW: Store full list of services
    const [stats, setStats] = useState({ average: 0, total: 0, fiveStar: 0 });

    // Filter States
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filterService, setFilterService] = useState('All');
    const [filterRating, setFilterRating] = useState('All');

    useEffect(() => {
        fetchReviewsData();
    }, []);

    const fetchReviewsData = async () => {
        try {
            // 1. Fetch User Info
            const profileRes = await api.get('/provider/profile/');
            setUserInfo({
                first_name: profileRes.data.first_name,
                last_name: profileRes.data.last_name
            });

            // 2. Fetch Reviews
            const reviewsRes = await api.get('/provider/reviews/');
            const fetchedReviews = reviewsRes.data;
            setReviews(fetchedReviews);

            // 3. Fetch All Services (NEW STEP)
            // This ensures the dropdown shows all services, even those with 0 reviews
            const servicesRes = await api.get('/provider/services/');
            setServicesList(servicesRes.data);

            // 4. Calculate Stats
            if (fetchedReviews.length > 0) {
                const total = fetchedReviews.length;
                const sum = fetchedReviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
                const fiveStar = fetchedReviews.filter(r => r.rating === 5).length;
                
                setStats({
                    average: (sum / total).toFixed(1),
                    total: total,
                    fiveStar: fiveStar
                });
            }

            setLoading(false);
        } catch (error) {
            console.error("Error loading reviews", error);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star 
                key={i} 
                size={14} 
                className={i < rating ? "text-warning fill-warning" : "text-muted"} 
                fill={i < rating ? "#ffc107" : "none"}
            />
        ));
    };

    // --- Filter Logic ---
    
    // Apply filters to the reviews array
    const filteredReviews = reviews.filter(review => {
        const matchesService = filterService === 'All' || review.service_name === filterService;
        const matchesRating = filterRating === 'All' || review.rating.toString() === filterRating;
        return matchesService && matchesRating;
    });

    const clearFilters = () => {
        setFilterService('All');
        setFilterRating('All');
        setShowFilterMenu(false);
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
            <Sidebar userInfo={userInfo} handleLogout={handleLogout} />

            <main className="main-content">
                <Container fluid>
                    <div className="header-welcome mb-4">
                        <h1>Customer Reviews</h1>
                        <p>See what your clients are saying about your work.</p>
                    </div>

                    {/* Stats Row */}
                    <Row className="g-4 mb-4">
                        <Col md={4}>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-title">Average Rating</span>
                                    <span className="stat-value display-4 fw-bold text-dark">
                                        {stats.average} <span className="text-muted fs-6">/ 5.0</span>
                                    </span>
                                </div>
                                <div className="stat-icon-wrapper bg-yellow-light">
                                    <Star size={24} />
                                </div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-title">Total Reviews</span>
                                    <span className="stat-value">{stats.total}</span>
                                </div>
                                <div className="stat-icon-wrapper bg-blue-light">
                                    <MessageSquare size={24} />
                                </div>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-title">5-Star Reviews</span>
                                    <span className="stat-value">{stats.fiveStar}</span>
                                </div>
                                <div className="stat-icon-wrapper bg-green-light">
                                    <ThumbsUp size={24} />
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Reviews Table Card */}
                    <div className="table-card position-relative">
                        <div className="section-header border-bottom pb-3 mb-0 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold">Recent Feedback</h5>
                            
                            <div className="position-relative">
                                <Button 
                                    variant={showFilterMenu ? "primary" : "outline-light"} 
                                    size="sm" 
                                    className={`border ${showFilterMenu ? '' : 'text-dark'}`}
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                >
                                    <Filter size={14} className="me-2" /> Filter
                                    {(filterService !== 'All' || filterRating !== 'All') && (
                                        <Badge bg="danger" className="ms-2" pill>!</Badge>
                                    )}
                                </Button>

                                {/* Custom Filter Dropdown Panel */}
                                {showFilterMenu && (
                                    <Card className="filter-popup shadow-lg border-0 position-absolute end-0 mt-2" style={{ width: '250px', zIndex: 1000 }}>
                                        <Card.Body className="p-3">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="mb-0 fw-bold">Filter By</h6>
                                                <X size={16} className="cursor-pointer text-muted" onClick={() => setShowFilterMenu(false)} />
                                            </div>
                                            
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small text-muted fw-bold">Service</Form.Label>
                                                <Form.Select 
                                                    size="sm" 
                                                    value={filterService}
                                                    onChange={(e) => setFilterService(e.target.value)}
                                                >
                                                    <option value="All">All Services</option>
                                                    {/* Map through the fetched Service List */}
                                                    {servicesList.map(service => (
                                                        <option key={service.serviceid} value={service.servicename}>
                                                            {service.servicename}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                                <Form.Label className="small text-muted fw-bold">Rating</Form.Label>
                                                <Form.Select 
                                                    size="sm" 
                                                    value={filterRating}
                                                    onChange={(e) => setFilterRating(e.target.value)}
                                                >
                                                    <option value="All">All Ratings</option>
                                                    <option value="5">5 Stars</option>
                                                    <option value="4">4 Stars</option>
                                                    <option value="3">3 Stars</option>
                                                    <option value="2">2 Stars</option>
                                                    <option value="1">1 Star</option>
                                                </Form.Select>
                                            </Form.Group>

                                            <div className="d-grid gap-2">
                                                <Button variant="primary" size="sm" onClick={() => setShowFilterMenu(false)}>
                                                    Apply
                                                </Button>
                                                {(filterService !== 'All' || filterRating !== 'All') && (
                                                    <Button variant="light" size="sm" className="text-muted" onClick={clearFilters}>
                                                        Clear Filters
                                                    </Button>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                )}
                            </div>
                        </div>
                        
                        <Table responsive hover className="custom-table align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th style={{width: '20%'}}>Client</th>
                                    <th style={{width: '20%'}}>Service</th>
                                    <th style={{width: '15%'}}>Rating</th>
                                    <th style={{width: '30%'}}>Comment</th>
                                    <th style={{width: '15%'}}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReviews.length > 0 ? (
                                    filteredReviews.map((review) => (
                                        <tr key={review.reviewid}>
                                            <td className="fw-bold">{review.client_name}</td>
                                            <td>
                                                <Badge bg="light" text="dark" className="border">
                                                    {review.service_name}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    {renderStars(review.rating)}
                                                </div>
                                            </td>
                                            <td>
                                                <p className="mb-0 text-muted small text-truncate-2">
                                                    {review.description || "No comment provided."}
                                                </p>
                                            </td>
                                            <td className="text-muted small">
                                                {new Date(review.createdat).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5">
                                            <div className="empty-state">
                                                <ThumbsUp size={48} className="mb-3 text-muted opacity-25" />
                                                <h5 className="text-muted">No reviews found</h5>
                                                <p className="text-muted small">
                                                    Try adjusting your filters to see results.
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

export default CustomerReviews;
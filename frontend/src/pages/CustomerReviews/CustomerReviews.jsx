// frontend/src/pages/CustomerReviews/CustomerReviews.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
    Grid, 
    Calendar, 
    Briefcase, 
    Star, 
    User, 
    LogOut, 
    MessageSquare,
    ThumbsUp
} from 'lucide-react';
import { Container, Row, Col, Table, Card, Spinner, ProgressBar } from 'react-bootstrap';
import { api } from "../../api/client"; 
import './CustomerReviews.css';

// --- Internal Sidebar Component (Consistent with Dashboard) ---
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
                <button onClick={handleLogout} className="logout-button">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

const CustomerReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

    // --- Fetch Reviews from API ---
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                // NOTE: Since backend is pending, ensure you create this endpoint later:
                // GET /api/service-provider/reviews/
                const response = await api.get('/service-provider/reviews/');
                const data = response.data;
                
                setReviews(data.reviews || []);
                
                // Calculate stats dynamically if not provided by backend
                const total = data.reviews ? data.reviews.length : 0;
                const sum = data.reviews ? data.reviews.reduce((acc, curr) => acc + curr.rating, 0) : 0;
                const avg = total > 0 ? (sum / total).toFixed(1) : 0;

                setStats({
                    averageRating: avg,
                    totalReviews: total
                });

            } catch (error) {
                console.error("Error fetching reviews:", error);
                // Fallback for empty state while developing
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    // Helper to render Star Icons
    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <Star 
                key={index} 
                size={16} 
                className={index < rating ? "star-filled" : "star-empty"} 
                fill={index < rating ? "#fbbf24" : "none"}
            />
        ));
    };

    const handleLogout = () => {
        // Implement logout logic here (clear token, redirect)
        console.log("Logging out...");
        window.location.href = '/login';
    };

    return (
        <div className="dashboard-root">
            <Sidebar handleLogout={handleLogout} />

            <main className="main-content">
                <Container fluid className="p-4">
                    {/* Page Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="fw-bold text-dark">Customer Reviews</h2>
                            <p className="text-muted">See what your clients are saying about your work.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <Row className="mb-4">
                                <Col md={6} lg={4}>
                                    <div className="stat-card">
                                        <div className="d-flex align-items-center">
                                            <div className="stat-icon-wrapper bg-yellow-light">
                                                <Star size={24} />
                                            </div>
                                            <div className="ms-3">
                                                <div className="stat-title">Average Rating</div>
                                                <div className="stat-value">{stats.averageRating} <span className="text-muted fs-6">/ 5.0</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6} lg={4}>
                                    <div className="stat-card">
                                        <div className="d-flex align-items-center">
                                            <div className="stat-icon-wrapper bg-blue-light">
                                                <MessageSquare size={24} />
                                            </div>
                                            <div className="ms-3">
                                                <div className="stat-title">Total Reviews</div>
                                                <div className="stat-value">{stats.totalReviews}</div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            {/* Reviews List Table */}
                            <div className="table-card">
                                <h5 className="section-title mb-4">Recent Feedback</h5>
                                <Table hover responsive className="custom-table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Client Name</th>
                                            <th>Service Provided</th>
                                            <th>Rating</th>
                                            <th style={{width: '40%'}}>Comment</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviews.length > 0 ? (
                                            reviews.map((review) => (
                                                <tr key={review.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar-circle">
                                                                {review.client_name ? review.client_name.charAt(0) : 'U'}
                                                            </div>
                                                            <span className="fw-bold ms-2">{review.client_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-primary">{review.service_name}</td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            {renderStars(review.rating)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <p className="mb-0 text-muted small-text">
                                                            "{review.comment}"
                                                        </p>
                                                    </td>
                                                    <td className="text-muted">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    <div className="empty-state">
                                                        <ThumbsUp size={48} className="mb-3 text-muted opacity-50" />
                                                        <h5>No reviews yet</h5>
                                                        <p className="text-muted">
                                                            Once you complete services, client reviews will appear here.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}
                </Container>
            </main>
        </div>
    );
};

export default CustomerReviews;
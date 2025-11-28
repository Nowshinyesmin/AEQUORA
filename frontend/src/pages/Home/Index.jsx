// frontend/src/pages/Home/Index.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Navbar, Nav } from 'react-bootstrap';
import {
  Users,
  Wrench,
  Shield,
  TrendingUp,
  Zap,
  Calendar,
  Lock,
  MapPin,
  Building2,
} from 'lucide-react';

import './Index.css';

// Card + icon styles
const cardStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s ease-in-out',
  height: '100%',
  backgroundColor: '#ffffff',
};

const iconWrapperStyle = {
  marginBottom: '1rem',
  color: '#111827',
};

const RoleCard = ({ icon: Icon, title, description }) => (
  <Card style={cardStyle} className="h-100 border-0">
    <Card.Body className="p-4 text-start d-flex flex-column">
      <div style={iconWrapperStyle}>
        <Icon size={36} strokeWidth={1.5} />
      </div>
      <Card.Title
        style={{
          fontWeight: 700,
          fontSize: '1.1rem',
          marginBottom: '0.5rem',
          color: '#111827',
        }}
      >
        {title}
      </Card.Title>
      <Card.Text
        style={{
          fontSize: '0.9rem',
          color: '#6b7280',
          lineHeight: '1.5',
        }}
      >
        {description}
      </Card.Text>
    </Card.Body>
  </Card>
);

const FeatureItem = ({ icon: Icon, title, description }) => (
  <div className="d-flex align-items-start mb-4">
    <div className="me-3 mt-1 p-2 rounded feature-icon-wrapper">
      <Icon size={20} strokeWidth={2} />
    </div>
    <div className="text-start">
      <h6 className="fw-bold mb-1 feature-item-title">{title}</h6>
      <p className="small mb-0 feature-item-text">{description}</p>
    </div>
  </div>
);

function HomePage() {
  return (
    <div className="home-root">
      {/* Navbar */}
      <Navbar bg="white" expand="lg" className="py-3 border-bottom">
        <Container>
          <Navbar.Brand
            href="/"
            className="d-flex align-items-center fw-bold text-dark brand-text"
          >
            <div className="brand-icon-wrapper">
              <Building2 size={18} />
            </div>
            Aequora
          </Navbar.Brand>

          <Nav className="ms-auto d-flex flex-row gap-2">
            <Link to="/login">
              <Button
                variant="dark"
                className="rounded-pill px-4 fw-bold"
                size="sm"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="outline-dark"
                className="rounded-pill px-4 fw-bold"
                size="sm"
              >
                Get Started
              </Button>
            </Link>
          </Nav>
        </Container>
      </Navbar>

      {/* Hero */}
      <Container className="text-center py-5 mt-4">
        <div className="d-flex justify-content-center mb-4">
          <div className="hero-main-icon-wrapper">
            <Building2 size={32} strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="fw-bolder text-dark mb-3 hero-title">
          Welcome to Aequora
        </h1>

        <p className="text-uppercase text-muted fw-bold small letter-spacing-2 mb-3">
          Your Smart Community Management Platform
        </p>

        <p className="lead text-secondary mb-5 mx-auto hero-subtitle">
          Connecting residents, service providers, and authorities for a better
          community experience.
        </p>

        <div className="d-flex justify-content-center gap-3 mb-5">
          <Link to="/login">
            <Button
              variant="dark"
              size="lg"
              className="px-4 py-2 fw-bold rounded-3 hero-btn"
            >
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button
              variant="light"
              size="lg"
              className="px-4 py-2 fw-bold border rounded-3 bg-white hero-btn-secondary"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </Container>

      {/* Role Cards */}
      <Container className="mb-5">
        <Row className="g-4">
          <Col md={6} lg={3}>
            <RoleCard
              icon={Users}
              title="Resident Portal"
              description="Report issues, book services, and stay connected with your community"
            />
          </Col>
          <Col md={6} lg={3}>
            <RoleCard
              icon={Wrench}
              title="Service Providers"
              description="Manage bookings, showcase services, and grow your business"
            />
          </Col>
          <Col md={6} lg={3}>
            <RoleCard
              icon={Shield}
              title="Authorities"
              description="Monitor issues, manage events, and respond to emergencies"
            />
          </Col>
          <Col md={6} lg={3}>
            <RoleCard
              icon={TrendingUp}
              title="Analytics"
              description="Track performance, analyze trends, and make data driven decisions"
            />
          </Col>
        </Row>
      </Container>

      {/* Platform Features */}
      <Container className="mb-5 pt-4">
        <div className="text-center mb-5">
          <h3 className="fw-bold section-title">Platform Features</h3>
        </div>
        <Row className="g-4 px-lg-5">
          <Col md={4}>
            <FeatureItem
              icon={MapPin}
              title="Issue Tracking"
              description="Report and track community issues with location tagging."
            />
            <FeatureItem
              icon={Zap}
              title="Emergency SOS"
              description="Quick emergency alerts with location sharing."
            />
          </Col>
          <Col md={4}>
            <FeatureItem
              icon={Wrench}
              title="Service Booking"
              description="Book trusted local service providers with transparent pricing."
            />
            <FeatureItem
              icon={Users}
              title="Community Voting"
              description="Vote on important issues and help prioritize improvements."
            />
          </Col>
          <Col md={4}>
            <FeatureItem
              icon={Calendar}
              title="Community Events"
              description="Stay informed about events, meetings, and announcements."
            />
            <FeatureItem
              icon={Lock}
              title="Secure Platform"
              description="Role-based access control and secure authentication."
            />
          </Col>
        </Row>
      </Container>

      {/* Footer CTA */}
      <div className="bg-white border-top py-5 mt-auto">
        <Container className="text-center">
          <div className="footer-cta">
            <h3 className="fw-bold mb-2 footer-title">
              Ready to Get Started?
            </h3>
            <p className="text-secondary mb-4 small">
              Join Aequora today and experience better community management
            </p>
            <Link to="/register">
              <Button
                variant="dark"
                className="px-4 py-2 fw-bold rounded-3 footer-btn"
              >
                Create Your Account
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    </div>
  );
}

export default HomePage;

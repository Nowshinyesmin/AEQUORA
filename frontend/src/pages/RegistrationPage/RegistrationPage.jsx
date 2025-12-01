// frontend/src/pages/RegistrationPage/RegistrationPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';

import './RegistrationPage.css';
import { api } from "../../api/client";

function RegistrationPage() {
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Resident',

    // Resident Specific
    houseNo: '',
    street: '',
    thana: '',
    district: '',
    emergencyContact: '',

    // Authority Specific
    deptName: '',
    designation: '',
    officeHouse: '',
    officeStreet: '',
    officeThana: '',
    officeDistrict: '',

    // Service Provider Specific
    serviceType: '',
    serviceArea: '',
    workingHours: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    // Basic Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Construct Payload based on Role
    let payload = {
      email: formData.email,
      username: formData.email, // Using email as username
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      role: formData.role,
      phone_number: formData.phone,
    };

    // Add role-specific fields
    if (formData.role === 'Resident') {
      payload = {
        ...payload,
        house_no: formData.houseNo,
        street: formData.street,
        thana: formData.thana,
        district: formData.district,
        emergency_contact: formData.emergencyContact,
      };
    } else if (formData.role === 'Authority') {
      payload = {
        ...payload,
        department_name: formData.deptName,
        designation: formData.designation,
        // Mapping office address to standard address fields if backend uses same table, 
        // or specific office fields if backend distinguishes them. 
        // Sending as specific keys for safety:
        office_house_no: formData.officeHouse,
        office_street: formData.officeStreet,
        office_thana: formData.officeThana,
        office_district: formData.officeDistrict,
      };
    } else if (formData.role === 'Service Provider') {
      payload = {
        ...payload,
        service_type: formData.serviceType,
        service_area: formData.serviceArea,
        working_hours: formData.workingHours,
      };
    }

    try {
      // POST http://127.0.0.1:8000/api/register/
      await api.post('register/', payload);
      setSuccessMessage('Success! Account created. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error("REGISTER ERROR:", err.response?.data || err.message);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === "object") {
          // Flatten error object to string if possible, or show generic message
          const firstError = Object.values(data)[0];
          setError(Array.isArray(firstError) ? firstError[0] : JSON.stringify(data));
        } else {
          setError("Registration failed. Please try again.");
        }
      } else {
        setError("Network Error: Could not connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-root">
      <Container style={{ maxWidth: '650px' }}>
        <Card className="register-card border-0 p-4">
          <Card.Body>
            {/* Header Section */}
            <div className="text-center mb-4">
              <div className="register-icon-wrapper">
                <Building2 size={28} />
              </div>
              <h2 className="register-title mb-1">Join Aequora</h2>
              <p className="register-subtitle">Create an account to access your community services</p>
            </div>

            {/* Alerts */}
            {successMessage && <Alert variant="success" className="py-2 text-sm">{successMessage}</Alert>}
            {error && <Alert variant="danger" className="py-2 text-sm">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              
              {/* --- Basic Information Section --- */}
              <h5 className="section-header">Basic Information</h5>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="firstName">
                    <Form.Label className="register-label">First Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="register-input"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mt-3 mt-md-0">
                  <Form.Group controlId="lastName">
                    <Form.Label className="register-label">Last Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="register-input"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3" controlId="email">
                <Form.Label className="register-label">Email *</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="register-input"
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="phone">
                <Form.Label className="register-label">Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="+880 1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  className="register-input"
                />
              </Form.Group>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="password">
                    <Form.Label className="register-label">Password *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Create a secure password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="register-input"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mt-3 mt-md-0">
                  <Form.Group controlId="confirmPassword">
                    <Form.Label className="register-label">Confirm Password *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="register-input"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4" controlId="role">
                <Form.Label className="register-label">Register As *</Form.Label>
                <Form.Select
                  value={formData.role}
                  onChange={handleChange}
                  className="register-select"
                >
                  <option value="Resident">Resident</option>
                  <option value="Authority">Authority</option>
                  <option value="Service Provider">Service Provider</option>
                </Form.Select>
              </Form.Group>

              <hr className="my-4 separator" />

              {/* --- Conditional Sections based on Role --- */}

              {/* 1. RESIDENT */}
              {formData.role === 'Resident' && (
                <>
                  <h5 className="section-header">Address Information</h5>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="houseNo">
                        <Form.Label className="register-label">House No.</Form.Label>
                        <Form.Control type="text" placeholder="123" value={formData.houseNo} onChange={handleChange} className="register-input" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="street">
                        <Form.Label className="register-label">Street</Form.Label>
                        <Form.Control type="text" placeholder="Main Street" value={formData.street} onChange={handleChange} className="register-input" />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="thana">
                        <Form.Label className="register-label">Thana</Form.Label>
                        <Form.Control type="text" placeholder="Gulshan" value={formData.thana} onChange={handleChange} className="register-input" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="district">
                        <Form.Label className="register-label">District</Form.Label>
                        <Form.Control type="text" placeholder="Dhaka" value={formData.district} onChange={handleChange} className="register-input" />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3" controlId="emergencyContact">
                    <Form.Label className="register-label">Emergency Contact</Form.Label>
                    <Form.Control type="text" placeholder="+880 1234567890" value={formData.emergencyContact} onChange={handleChange} className="register-input" />
                  </Form.Group>
                </>
              )}

              {/* 2. AUTHORITY */}
              {formData.role === 'Authority' && (
                <>
                  <h5 className="section-header">Authority Information</h5>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="deptName">
                        <Form.Label className="register-label">Department Name</Form.Label>
                        <Form.Control type="text" placeholder="e.g., Public Works" value={formData.deptName} onChange={handleChange} className="register-input" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="designation">
                        <Form.Label className="register-label">Designation</Form.Label>
                        <Form.Control type="text" placeholder="e.g., Inspector" value={formData.designation} onChange={handleChange} className="register-input" />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <h6 className="subsection-header">Office Address</h6>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="officeHouse">
                        <Form.Label className="register-label">House No.</Form.Label>
                        <Form.Control type="text" placeholder="123" value={formData.officeHouse} onChange={handleChange} className="register-input" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="officeStreet">
                        <Form.Label className="register-label">Street</Form.Label>
                        <Form.Control type="text" placeholder="Main Street" value={formData.officeStreet} onChange={handleChange} className="register-input" />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="officeThana">
                        <Form.Label className="register-label">Thana</Form.Label>
                        <Form.Control type="text" placeholder="Gulshan" value={formData.officeThana} onChange={handleChange} className="register-input" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="officeDistrict">
                        <Form.Label className="register-label">District</Form.Label>
                        <Form.Control type="text" placeholder="Dhaka" value={formData.officeDistrict} onChange={handleChange} className="register-input" />
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}

              {/* 3. SERVICE PROVIDER */}
              {formData.role === 'Service Provider' && (
                <>
                  <h5 className="section-header">Service Information</h5>
                  <Form.Group className="mb-3" controlId="serviceType">
                    <Form.Label className="register-label">Service Type</Form.Label>
                    <Form.Control type="text" placeholder="e.g., Plumber, Electrician, Cleaner" value={formData.serviceType} onChange={handleChange} className="register-input" />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="serviceArea">
                    <Form.Label className="register-label">Service Area</Form.Label>
                    <Form.Control type="text" placeholder="e.g., Gulshan, Banani, Baridhara" value={formData.serviceArea} onChange={handleChange} className="register-input" />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="workingHours">
                    <Form.Label className="register-label">Working Hours</Form.Label>
                    <Form.Control type="text" placeholder="e.g., 9:00 AM - 6:00 PM" value={formData.workingHours} onChange={handleChange} className="register-input" />
                  </Form.Group>
                </>
              )}

              {/* Submit Button */}
              <Button
                variant="dark"
                type="submit"
                className="w-100 btn-register d-flex align-items-center justify-content-center mt-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin me-2" size={18} />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </Form>

            {/* Footer */}
            <div className="text-center mt-4 pt-2">
              <p className="text-secondary small mb-0">
                Already have an account?{' '}
                <Link to="/login" className="register-link">
                  Sign in
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default RegistrationPage;
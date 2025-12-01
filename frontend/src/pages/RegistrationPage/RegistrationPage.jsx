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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

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

    // base payload
    let payload = {
      email: formData.email,
      username: formData.email,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      role: formData.role,
      phone_number: formData.phone,
    };

    // role-specific
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
        office_house_no: formData.officeHouse,
        office_street: formData.officeStreet,
        office_thana: formData.officeThana,
        office_district: formData.officeDistrict,
      };
    } else if (formData.role === 'ServiceProvider') {
      payload = {
        ...payload,
        service_type: formData.serviceType,
        service_area: formData.serviceArea,
        working_hours: formData.workingHours,
      };
    }

    try {
      await api.post('register/', payload);
      setSuccessMessage('Success! Account created. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error("REGISTER ERROR:", err.response?.data || err.message);
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === "object") {
          const firstError = Object.values(data)[0];
          setError(Array.isArray(firstError) ? firstError[0] : JSON.stringify(data));
        } else {
          setError("Registration failed. Please try again.");
        }
      } else {
        setError("Network Error: Could not connect to server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-root">
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Card className="register-card shadow">
          <Card.Body>
            <div className="text-center mb-4">
              <div className="register-icon mb-3">
                <Building2 size={32} />
              </div>
              <h2 className="register-title">Join Aequora</h2>
              <p className="register-subtitle">
                Create an account to access your community services
              </p>
            </div>

            {successMessage && (
              <Alert variant="success" className="py-2 text-sm">{successMessage}</Alert>
            )}
            {error && (
              <Alert variant="danger" className="py-2 text-sm">{error}</Alert>
            )}

            <Form onSubmit={handleSubmit}>
              {/* Basic Information */}
              <h5 className="section-header">Basic Information</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="firstName">
                    <Form.Label className="register-label">First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="register-input"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="lastName">
                    <Form.Label className="register-label">Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="register-input"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3" controlId="email">
                <Form.Label className="register-label">Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="register-input"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="phone">
                <Form.Label className="register-label">Phone Number</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="register-input"
                  required
                />
              </Form.Group>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="password">
                    <Form.Label className="register-label">Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="register-input"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="confirmPassword">
                    <Form.Label className="register-label">Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="register-input"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Role Select */}
              <Form.Group className="mb-4" controlId="role">
                <Form.Label className="register-label">Register As *</Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="register-select"
                >
                  <option value="Resident">Resident</option>
                  <option value="Authority">Authority</option>
                  <option value="ServiceProvider">Service Provider</option>
                </Form.Select>
              </Form.Group>

              {/* 1. RESIDENT */}
              {formData.role === 'Resident' && (
                <>
                  <h5 className="section-header">Address Information</h5>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="houseNo">
                        <Form.Label className="register-label">House No</Form.Label>
                        <Form.Control
                          type="text"
                          name="houseNo"
                          value={formData.houseNo}
                          onChange={handleChange}
                          className="register-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="street">
                        <Form.Label className="register-label">Street</Form.Label>
                        <Form.Control
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          className="register-input"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="thana">
                        <Form.Label className="register-label">Thana</Form.Label>
                        <Form.Control
                          type="text"
                          name="thana"
                          value={formData.thana}
                          onChange={handleChange}
                          className="register-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="district">
                        <Form.Label className="register-label">District</Form.Label>
                        <Form.Control
                          type="text"
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          className="register-input"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3" controlId="emergencyContact">
                    <Form.Label className="register-label">Emergency Contact</Form.Label>
                    <Form.Control
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      className="register-input"
                    />
                  </Form.Group>
                </>
              )}

              {/* 2. AUTHORITY */}
              {formData.role === 'Authority' && (
                <>
                  <h5 className="section-header">Authority Information</h5>

                  <Form.Group className="mb-3" controlId="deptName">
                    <Form.Label className="register-label">Department Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="deptName"
                      value={formData.deptName}
                      onChange={handleChange}
                      className="register-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="designation">
                    <Form.Label className="register-label">Designation</Form.Label>
                    <Form.Control
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="register-input"
                    />
                  </Form.Group>

                  <h6 className="section-header mt-3">Office Address</h6>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="officeHouse">
                        <Form.Label className="register-label">House No</Form.Label>
                        <Form.Control
                          type="text"
                          name="officeHouse"
                          value={formData.officeHouse}
                          onChange={handleChange}
                          className="register-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="officeStreet">
                        <Form.Label className="register-label">Street</Form.Label>
                        <Form.Control
                          type="text"
                          name="officeStreet"
                          value={formData.officeStreet}
                          onChange={handleChange}
                          className="register-input"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group controlId="officeThana">
                        <Form.Label className="register-label">Thana</Form.Label>
                        <Form.Control
                          type="text"
                          name="officeThana"
                          value={formData.officeThana}
                          onChange={handleChange}
                          className="register-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="officeDistrict">
                        <Form.Label className="register-label">District</Form.Label>
                        <Form.Control
                          type="text"
                          name="officeDistrict"
                          value={formData.officeDistrict}
                          onChange={handleChange}
                          className="register-input"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}

              {/* 3. SERVICE PROVIDER */}
              {formData.role === 'ServiceProvider' && (
                <>
                  <h5 className="section-header">Service Information</h5>

                  <Form.Group className="mb-3" controlId="serviceType">
                    <Form.Label className="register-label">Service Type</Form.Label>
                    <Form.Control
                      type="text"
                      name="serviceType"
                      placeholder="e.g., Plumber, Electrician, Cleaner"
                      value={formData.serviceType}
                      onChange={handleChange}
                      className="register-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="serviceArea">
                    <Form.Label className="register-label">Service Area</Form.Label>
                    <Form.Control
                      type="text"
                      name="serviceArea"
                      placeholder="e.g., Gulshan, Banani, Baridhara"
                      value={formData.serviceArea}
                      onChange={handleChange}
                      className="register-input"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="workingHours">
                    <Form.Label className="register-label">Working Hours</Form.Label>
                    <Form.Control
                      type="text"
                      name="workingHours"
                      placeholder="e.g., 9:00 AM - 6:00 PM"
                      value={formData.workingHours}
                      onChange={handleChange}
                      className="register-input"
                    />
                  </Form.Group>
                </>
              )}

              <div className="d-grid mt-4">
                <Button
                  type="submit"
                  className="register-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="me-2 spinner-border spinner-border-sm" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </Form>

            <div className="text-center mt-3">
              <p className="mb-0">
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
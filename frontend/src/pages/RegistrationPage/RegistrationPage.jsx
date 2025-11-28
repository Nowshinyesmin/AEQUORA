// frontend/src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';

// Import the specific CSS file
import './RegistrationPage.css';

const ROLES = ['Resident', 'ServiceProvider', 'Authority'];

function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '', // This acts as the Email input
    password: '',
    role: 'Resident',
    phone: '',
    houseNo: '',
    street: '',
    thana: '',
    district: ''
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

    if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
    }

    const payload = {
        email: formData.username,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        phone_number: formData.phone,
        house_no: formData.houseNo,
        street: formData.street,
        thana: formData.thana,
        district: formData.district
    };
    
    try {
        const response = await fetch('http://127.0.0.1:8000/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            setSuccessMessage(`Success! Account created. Redirecting...`);
            setTimeout(() => navigate('/login'), 2000);
        } else {
            let errorMessage = 'Registration failed.';
            if (data.email) errorMessage = data.email[0];
            else if (data.error) errorMessage = data.error;
            else if (data.detail) errorMessage = data.detail;
            setError(errorMessage);
        }

    } catch (err) {
        setError('Network Error: Could not connect to the server. Is the backend running?');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="register-root">
      <Container style={{ maxWidth: '600px' }}>
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
              
              {/* Row 1: Names */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="firstName">
                    <Form.Label className="register-label">First Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={formData.firstName} 
                      onChange={handleChange} 
                      required 
                      className="register-input"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mt-3 mt-md-0">
                  <Form.Group controlId="lastName">
                    <Form.Label className="register-label">Last Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={formData.lastName} 
                      onChange={handleChange} 
                      required 
                      className="register-input"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 2: Email */}
              <Form.Group className="mb-3" controlId="username">
                <Form.Label className="register-label">Email</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder="your.email@example.com" 
                  value={formData.username} 
                  onChange={handleChange} 
                  required 
                  className="register-input"
                />
              </Form.Group>

              {/* Row 3: Password */}
              <Form.Group className="mb-3" controlId="password">
                <Form.Label className="register-label">Password</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder="Create a secure password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  className="register-input"
                />
              </Form.Group>

              {/* Row 4: Register As */}
              <Form.Group className="mb-3" controlId="role">
                <Form.Label className="register-label">Register As</Form.Label>
                <Form.Select 
                  value={formData.role} 
                  onChange={handleChange} 
                  className="register-select"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Row 5: Phone Number */}
              <Form.Group className="mb-3" controlId="phone">
                <Form.Label className="register-label">Phone Number</Form.Label>
                <Form.Control 
                  type="tel" 
                  placeholder="01XXXXXXXXX" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="register-input"
                />
              </Form.Group>

              {/* Row 6: Address Line 1 */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="houseNo">
                    <Form.Label className="register-label">House No</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={formData.houseNo} 
                      onChange={handleChange} 
                      className="register-input"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mt-3 mt-md-0">
                  <Form.Group controlId="street">
                    <Form.Label className="register-label">Street</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={formData.street} 
                      onChange={handleChange} 
                      className="register-input"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Row 7: Address Line 2 */}
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group controlId="thana">
                    <Form.Label className="register-label">Thana</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={formData.thana} 
                      onChange={handleChange} 
                      className="register-input"
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mt-3 mt-md-0">
                  <Form.Group controlId="district">
                    <Form.Label className="register-label">District</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={formData.district} 
                      onChange={handleChange} 
                      className="register-input"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Submit Button */}
              <Button 
                variant="dark" 
                type="submit" 
                className="w-100 btn-register d-flex align-items-center justify-content-center"
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

export default RegisterPage;
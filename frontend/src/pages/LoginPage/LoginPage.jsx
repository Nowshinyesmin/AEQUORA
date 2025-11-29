// frontend/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';

// Import the specific CSS file
import './LoginPage.css';
import { api } from "../../api/client";


function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      username: email, // backend expects "username" field (email string)
      password: password,
    };

    try {
      // POST http://127.0.0.1:8000/api/login/
      const response = await api.post('login/', payload);
      const data = response.data;

      // Save token
      if (data.auth_token) {
        localStorage.setItem('token', data.auth_token);
      }

      // TODO: you can inspect data.role and redirect differently if needed
      navigate('/resident/dashboard');
    } catch (err) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        const errorMessage = data.non_field_errors
          ? data.non_field_errors[0]
          : 'Invalid email or password.';
        setError(errorMessage);
      } else {
        setError('Network Error: Could not connect to the server. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <Container style={{ maxWidth: '500px' }}>
        <Card className="auth-card border-0 p-4">
          <Card.Body>
            {/* Logo Section */}
            <div className="text-center mb-4">
              <div className="auth-icon-wrapper">
                <Building2 size={32} />
              </div>
              <h2 className="auth-title mb-1">Welcome to Aequora</h2>
              <p className="auth-subtitle">Sign in to access your community dashboard</p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="danger" className="py-2 text-sm">
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Form onSubmit={handleSubmit}>
              {/* Email Group */}
              <Form.Group className="mb-3" controlId="username">
                <Form.Label className="form-label-custom">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-control-custom"
                />
              </Form.Group>

              {/* Password Group */}
              <Form.Group className="mb-4" controlId="password">
                <Form.Label className="form-label-custom">Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-control-custom"
                />
              </Form.Group>

              {/* Sign In Button */}
              <Button
                variant="dark"
                type="submit"
                className="w-100 btn-auth d-flex align-items-center justify-content-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin me-2" size={18} />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Form>

            {/* Footer */}
            <div className="text-center mt-4 pt-3">
              <p className="text-secondary small mb-0">
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">
                  Register here
                </Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default LoginPage;

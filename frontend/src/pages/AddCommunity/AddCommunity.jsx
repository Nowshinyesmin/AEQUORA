import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  LogOut,
  MapPin,
  PlusCircle,
} from "lucide-react";
import { Row, Col, Form, Button } from "react-bootstrap";
import "./AddCommunity.css";

function AddCommunity() {
  const navigate = useNavigate();
   
  const [community, setCommunity] = useState({
    name: "",
    city: "",
    district: "",
    thana: "",
    postalCode: "",
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/admin/profile");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCommunity((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: connect to backend later with api.post("/community/", community)
    console.log("Add community:", community);
  };

  return (
    <div className="dashboard-root">
      {/* ----- SIDEBAR ----- */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">Aequora</div>

        <div className="user-profile-section">
          <div className="user-name-display">Admin User</div>
          <div className="user-role-display">Admin</div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/AdminDashboard" className="nav-link-custom">
            <LayoutDashboard size={20} className="nav-icon" />
            Dashboard
          </Link>

          {/* ACTIVE PAGE */}
          <Link to="/admin/add-community" className="nav-link-custom active">
            <Building2 size={20} className="nav-icon" />
            Add Community
          </Link>

          <Link to="/admin/communities" className="nav-link-custom">
            <ClipboardList size={20} className="nav-icon" />
            Manage Communities
          </Link>

          <Link to="/admin/users" className="nav-link-custom">
            <Users size={20} className="nav-icon" />
            Manage Users
          </Link>

          <button className="nav-link-custom" onClick={goToProfile}>
            <Users size={20} className="nav-icon" />
            Profile
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} className="me-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* ----- MAIN CONTENT ----- */}
      <main className="dashboard-main">
        {/* top-right profile circle */}
        <div className="header-right-actions">
          <button className="admin-profile-circle" onClick={goToProfile}>
            Admin
          </button>
        </div>

        <div className="page-header-mb">
          <h1 className="page-title">Add Community</h1>
          <p className="page-subtitle">
            Create a new community so residents can start using Aequora.
          </p>
        </div>

        <Row>
          <Col md={8} lg={7}>
            <div className="form-card">
              <div className="form-card-header">
                <div className="form-card-title-wrap">
                  <PlusCircle size={20} className="me-2" />
                  <span>Community Details</span>
                </div>
                <span className="form-card-caption">
                  Fill in the basic information for the community.
                </span>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="name">
                  <Form.Label>Community Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={community.name}
                    onChange={handleChange}
                    placeholder="e.g. Dhaka Community Hub"
                    required
                  />
                </Form.Group>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="city">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={community.city}
                        onChange={handleChange}
                        placeholder="e.g. Dhaka"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="district">
                      <Form.Label>District</Form.Label>
                      <Form.Control
                        type="text"
                        name="district"
                        value={community.district}
                        onChange={handleChange}
                        placeholder="e.g. Dhaka"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-1">
                  <Col md={6}>
                    <Form.Group controlId="thana">
                      <Form.Label>Thana</Form.Label>
                      <Form.Control
                        type="text"
                        name="thana"
                        value={community.thana}
                        onChange={handleChange}
                        placeholder="e.g. Gulshan"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group controlId="postalCode">
                      <Form.Label>Postal Code</Form.Label>
                      <Form.Control
                        type="text"
                        name="postalCode"
                        value={community.postalCode}
                        onChange={handleChange}
                        placeholder="e.g. 1212"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="form-actions">
                  <Button type="submit" className="btn-primary-rounded">
                    <MapPin size={18} className="me-2" />
                    Create Community
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </main>
    </div>
  );
}

export default AddCommunity;

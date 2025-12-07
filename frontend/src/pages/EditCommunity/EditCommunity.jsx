import React, { useState } from "react";
import { useLocation, useNavigate, Link, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  LogOut,
  MapPin,
  Pencil,
} from "lucide-react";
import { Row, Col, Form, Button } from "react-bootstrap";
import "./EditCommunity.css";

function EditCommunity() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // community passed from ViewCommunities via route state
  const passedCommunity = location.state?.community;

  const [community, setCommunity] = useState(
    passedCommunity || {
      communityID: id,
      communityName: "",
      city: "",
      district: "",
      thana: "",
      postalCode: "",
      createdAt: "",
    }
  );

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
    console.log("Updated community:", community);
    // later: api.put(`/community/${community.communityID}/`, community)
    // then navigate back:
    // navigate("/admin/communities");
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

          <Link to="/admin/add-community" className="nav-link-custom">
            <Building2 size={20} className="nav-icon" />
            Add Community
          </Link>

          <Link to="/admin/communities" className="nav-link-custom active">
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
            AD
          </button>
        </div>

        <div className="page-header-mb">
          <h1 className="page-title">Edit Community</h1>
          <p className="page-subtitle">
            Update the details of this community.
          </p>
        </div>

        <Row>
          <Col md={8} lg={7}>
            <div className="form-card">
              <div className="form-card-header">
                <div className="form-card-title-wrap">
                  <Pencil size={20} className="me-2" />
                  <span>Community Information</span>
                </div>
                <span className="form-card-caption">
                  Modify the fields below and save your changes.
                </span>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="communityName">
                  <Form.Label>Community Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="communityName"
                    value={community.communityName}
                    onChange={handleChange}
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
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mt-3 mb-2" controlId="createdAt">
                  <Form.Label>Created At</Form.Label>
                  <Form.Control
                    type="text"
                    name="createdAt"
                    value={community.createdAt}
                    disabled
                    readOnly
                  />
                </Form.Group>

                <div className="form-actions">
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="btn-outline-rounded me-2"
                    onClick={() => navigate("/admin/communities")}
                  >
                    Cancel
                  </Button>

                  <Button type="submit" className="btn-primary-rounded">
                    <MapPin size={18} className="me-2" />
                    Save Changes
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

export default EditCommunity;

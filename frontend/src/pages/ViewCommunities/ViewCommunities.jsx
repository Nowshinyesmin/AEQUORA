// frontend/src/pages/ViewCommunities/ViewCommunities.jsx

import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  LogOut,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { Row, Col, Button, Table } from "react-bootstrap";
import "./ViewCommunities.css";

function ViewCommunities() {
  const navigate = useNavigate();

  // dummy local state – later you can fill from backend
  const [communities, setCommunities] = useState([]);


  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/admin/profile");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // filter by Community Name (startsWith, case-insensitive)
  const filteredCommunities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return communities;
    return communities.filter((c) =>
      c.communityName.toLowerCase().startsWith(term)
    );
  }, [communities, searchTerm]);

  // ✅ Go to edit page, pass full community object via route state
  const handleEdit = (community) => {
    navigate(`/admin/communities/${community.communityID}/edit`, {
      state: { community },
    });
  };

  const handleDelete = (communityID) => {
    console.log("Delete community", communityID);
    // later: call backend then update state:
    // setCommunities(prev => prev.filter(c => c.communityID !== communityID));
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

          {/* ACTIVE PAGE */}
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
            Admin
          </button>
        </div>

        <div className="page-header-mb">
          <h1 className="page-title">Manage Communities</h1>
          <p className="page-subtitle">
            Browse and manage all communities registered in Aequora.
          </p>
        </div>

        <Row>
          <Col xs={12}>
            <div className="table-card">
              <div className="table-card-header">
                <div className="search-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by Community Name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                <div className="table-meta">
                  <span>
                    Showing {filteredCommunities.length} of {communities.length}{" "}
                    communities
                  </span>
                </div>
              </div>

              <div className="table-responsive-custom">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Community ID</th>
                      <th>Community Name</th>
                      <th>City</th>
                      <th>District</th>
                      <th>Thana</th>
                      <th>Postal Code</th>
                      <th>Created At</th>
                      <th style={{ width: "130px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommunities.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-row">
                          No communities found for that name.
                        </td>
                      </tr>
                    ) : (
                      filteredCommunities.map((c) => (
                        <tr key={c.communityID}>
                          <td>{c.communityID}</td>
                          <td>{c.communityName}</td>
                          <td>{c.city}</td>
                          <td>{c.district}</td>
                          <td>{c.thana}</td>
                          <td>{c.postalCode}</td>
                          <td>{c.createdAt}</td>
                          <td>
                            <div className="action-buttons">
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                className="btn-table"
                                onClick={() => handleEdit(c)}
                              >
                                <Pencil size={15} className="me-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                className="btn-table"
                                onClick={() =>
                                  handleDelete(c.communityID)
                                }
                              >
                                <Trash2 size={15} className="me-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </Col>
        </Row>
      </main>
    </div>
  );
}

export default ViewCommunities;

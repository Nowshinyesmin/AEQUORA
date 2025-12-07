// frontend/src/pages/ViewUsers/ViewUsers.jsx

import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  LogOut,
  Search,
  Eye,
  UserX,
} from "lucide-react";
import { Row, Col, Button, Table } from "react-bootstrap";
import "./ViewUsers.css";

function ViewUsers() {
  const navigate = useNavigate();

  // 🔹 Dummy data – later replace with backend data
  const [users, setUsers] = useState([]);


  const [searchTerm, setSearchTerm] = useState("");
  const [communityFilter, setCommunityFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

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

  const handleCommunityChange = (e) => {
    setCommunityFilter(e.target.value);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
  };

  // 🔹 Distinct communities from current user list
  const communityOptions = useMemo(() => {
    const set = new Set();
    users.forEach((u) => {
      if (u.communityName && u.communityName !== "-") {
        set.add(u.communityName);
      }
    });
    return Array.from(set);
  }, [users]);

  // 🔍 search + filter by community + filter by role
  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return users.filter((u) => {
      const matchesSearch =
        !term ||
        u.fullName.toLowerCase().startsWith(term) ||
        u.email.toLowerCase().includes(term);

      const matchesCommunity =
        communityFilter === "All" || u.communityName === communityFilter;

      const matchesRole = roleFilter === "All" || u.role === roleFilter;

      return matchesSearch && matchesCommunity && matchesRole;
    });
  }, [users, searchTerm, communityFilter, roleFilter]);

  const handleView = (userID) => {
    console.log("View user", userID);
    // later: navigate(`/admin/users/${userID}`);
  };

  const handleToggleStatus = (userID) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.userID === userID
          ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
          : u
      )
    );
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

          <Link to="/admin/communities" className="nav-link-custom">
            <ClipboardList size={20} className="nav-icon" />
            Manage Communities
          </Link>

          {/* ACTIVE PAGE */}
          <Link to="/admin/users" className="nav-link-custom active">
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
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">
            Browse and manage all users registered in Aequora.
          </p>
        </div>

        <Row>
          <Col xs={12}>
            <div className="table-card">
              <div className="table-card-header">
                {/* 🔽 search + filters on the left */}
                <div className="filters-row">
                  <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search by Name or Email..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>

                  <select
                    className="filter-select"
                    value={communityFilter}
                    onChange={handleCommunityChange}
                  >
                    <option value="All">All Communities</option>
                    {communityOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="filter-select"
                    value={roleFilter}
                    onChange={handleRoleChange}
                  >
                    <option value="All">All Roles</option>
                    <option value="Resident">Resident</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* meta text on the right */}
                <div className="table-meta">
                  <span>
                    Showing {filteredUsers.length} of {users.length} users
                  </span>
                </div>
              </div>

              <div className="table-responsive-custom">
                <Table hover>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Community</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th style={{ width: "160px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-row">
                          No users found for that search/filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.userID}>
                          <td>{u.userID}</td>
                          <td>{u.fullName}</td>
                          <td>{u.email}</td>
                          <td>{u.role}</td>
                          <td>{u.communityName}</td>
                          <td>
                            <span
                              className={
                                u.status === "Active"
                                  ? "status-pill active"
                                  : "status-pill inactive"
                              }
                            >
                              {u.status}
                            </span>
                          </td>
                          <td>{u.createdAt}</td>
                          <td>
                            <div className="action-buttons">
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                className="btn-table"
                                onClick={() => handleView(u.userID)}
                              >
                                <Eye size={15} className="me-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant={
                                  u.status === "Active"
                                    ? "outline-danger"
                                    : "outline-success"
                                }
                                className="btn-table"
                                onClick={() => handleToggleStatus(u.userID)}
                              >
                                <UserX size={15} className="me-1" />
                                {u.status === "Active"
                                  ? "Deactivate"
                                  : "Activate"}
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

export default ViewUsers;

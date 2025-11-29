// frontend/src/pages/IssueReports/IssueReports.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  AlertCircle, 
  Briefcase, 
  Calendar, 
  Bell, 
  LogOut, 
  Plus,
  X, // Added X icon for Cancel button
  User
} from "lucide-react";
import { Button, Form } from "react-bootstrap";
import "./IssueReports.css";
import { api } from "../../api/client"; 

// --- Internal Sidebar Component ---
const Sidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ firstName: 'Resident', lastName: '', role: 'Resident' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await api.get('auth/users/me/');
        setUserInfo({
          firstName: response.data.first_name || 'A',
          lastName: response.data.last_name || 'A',
          role: 'Resident'
        });
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getDisplayName = () => `${userInfo.firstName} ${userInfo.lastName}`;

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">Aequora</div>

      <div className="user-profile-section">
        <div className="user-name-display">
          {loading ? '...' : getDisplayName()}
        </div>
        <div className="user-role-display">
          {userInfo.role}
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/resident/dashboard" className="nav-link-custom">
          <LayoutDashboard size={20} className="nav-icon" />
          Dashboard
        </Link>
        <Link to="/report-issue" className="nav-link-custom active">
          <AlertCircle size={20} className="nav-icon" />
          Report Issue
        </Link>
        <Link to="/book-service" className="nav-link-custom">
          <Briefcase size={20} className="nav-icon" />
          Book Service
        </Link>
        <Link to="/events" className="nav-link-custom">
          <Calendar size={20} className="nav-icon" />
          Events
        </Link>
        <Link to="/sos" className="nav-link-custom">
          <Bell size={20} className="nav-icon" />
          Emergency SOS
        </Link>
        <Link to="/profile" className="nav-link-custom">
          <User size={20} className="nav-icon" />
          Profile
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} className="me-2" />
          Logout
        </button>
      </div>
    </aside>
  );
};

// --- Main Page Component ---
const IssueReports = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [showForm, setShowForm] = useState(false); // State to toggle form

  const filters = ["All", "Pending", "In Progress", "Resolved"];

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Section */}
      <Sidebar />

      {/* Main Content Section */}
      <main className="main-content">
        
        {/* Header */}
        <div className="page-header">
          <div className="page-title">
            <h1>Issue Reports</h1>
            <div className="page-subtitle">Report and track community issues</div>
          </div>
          
          {/* Toggle Button */}
          <Button 
            variant="dark" 
            className="d-flex align-items-center gap-2"
            onClick={toggleForm}
          >
            {showForm ? (
              <>
                <Plus size={18} style={{transform: 'rotate(45deg)'}} /> 
                Cancel
              </>
            ) : (
              <>
                <Plus size={18} />
                Report Issue
              </>
            )}
          </Button>
        </div>

        {/* --- Report New Issue Form Card --- */}
        {showForm && (
          <div className="report-form-card">
            <h5 className="form-card-title">Report New Issue</h5>
            <Form>
              {/* Title */}
              <Form.Group className="mb-3">
                <Form.Label className="custom-label">Title *</Form.Label>
                <Form.Control type="text" className="custom-input" />
              </Form.Group>

              {/* Type */}
              <Form.Group className="mb-3">
                <Form.Label className="custom-label">Type</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g., Infrastructure, Sanitation, Security" 
                  className="custom-input" 
                />
              </Form.Group>

              {/* Description */}
              <Form.Group className="mb-3">
                <Form.Label className="custom-label">Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  className="custom-input" 
                />
              </Form.Group>

              {/* Priority Level */}
              <Form.Group className="mb-3">
                <Form.Label className="custom-label">Priority Level</Form.Label>
                <Form.Select className="custom-input" defaultValue="Medium">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Form.Select>
              </Form.Group>

              {/* Location */}
              <Form.Group className="mb-4">
                <Form.Label className="custom-label">Location</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Enter location address" 
                  className="custom-input" 
                />
              </Form.Group>

              {/* Submit Button */}
              <Button variant="dark" className="w-100 btn-submit-issue">
                Submit Issue Report
              </Button>
            </Form>
          </div>
        )}

        {/* Filters */}
        <div className="filter-group">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? "active" : ""}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Content Area - Empty State */}
        <div className="empty-state-card">
          No issues found. Report your first issue!
        </div>

      </main>
    </div>
  );
};

export default IssueReports;
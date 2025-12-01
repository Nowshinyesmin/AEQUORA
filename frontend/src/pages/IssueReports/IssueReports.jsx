// frontend/src/pages/IssueReports/IssueReports.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, 
  Plus, X, User, MapPin, Clock, CheckCircle
} from "lucide-react";
import { Button, Form } from "react-bootstrap";
import "./IssueReports.css";
import { api } from "../../api/client"; 

// --- Internal Sidebar Component ---
const Sidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ firstName: 'Resident', lastName: '', role: 'Resident' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('auth/users/me/');
        setUserInfo({
          firstName: response.data.firstname || 'Resident',
          lastName: response.data.lastname || '',
          role: 'Resident'
        });
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">Aequora</div>
      <div className="user-profile-section">
        <div className="user-name-display">{userInfo.firstName} {userInfo.lastName}</div>
        <div className="user-role-display">{userInfo.role}</div>
      </div>
      <nav className="sidebar-nav">
        <Link to="/resident/dashboard" className="nav-link-custom"><LayoutDashboard size={20} className="nav-icon" />Dashboard</Link>
        <Link to="/report-issue" className="nav-link-custom active"><AlertCircle size={20} className="nav-icon" />Report Issue</Link>
        <Link to="/book-service" className="nav-link-custom"><Briefcase size={20} className="nav-icon" />Book Service</Link>
        <Link to="/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" />Events</Link>
        <Link to="/sos" className="nav-link-custom"><Bell size={20} className="nav-icon" />Emergency SOS</Link>
        <Link to="/profile" className="nav-link-custom"><User size={20} className="nav-icon" />Profile</Link>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button>
      </div>
    </aside>
  );
};

// --- Main Page Component ---
const IssueReports = () => {
  const [issues, setIssues] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    description: "",
    prioritylevel: "Medium",
    mapaddress: "" // We map this to the "Location" input
  });

  const filters = ["All", "Pending", "In Progress", "Resolved"];

  // 1. Fetch Issues on Load
  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await api.get('resident/issues/');
      setIssues(response.data);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
    }
  };

  // 2. Handle Input Changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 3. Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    try {
      await api.post('resident/issues/', formData);
      alert("Issue reported successfully!");
      setShowForm(false); // Close form
      setFormData({ // Reset form
        title: "",
        type: "",
        description: "",
        prioritylevel: "Medium",
        mapaddress: ""
      });
      fetchIssues(); // Refresh list
    } catch (error) {
      console.error("Failed to report issue:", error);
      alert("Failed to submit report. Please try again.");
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  // Filter Logic
  const filteredIssues = activeFilter === "All" 
    ? issues 
    : issues.filter(issue => issue.status === activeFilter);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        
        <div className="page-header">
          <div className="page-title">
            <h1>Issue Reports</h1>
            <div className="page-subtitle">Report and track community issues</div>
          </div>
          
          <Button variant="dark" className="d-flex align-items-center gap-2" onClick={toggleForm}>
            {showForm ? <><Plus size={18} style={{transform: 'rotate(45deg)'}} /> Cancel</> : <><Plus size={18} /> Report Issue</>}
          </Button>
        </div>

        {/* --- Report Form --- */}
        {showForm && (
          <div className="report-form-card">
            <h5 className="form-card-title">Report New Issue</h5>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="custom-label">Title *</Form.Label>
                <Form.Control 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="custom-input" 
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="custom-label">Type</Form.Label>
                <Form.Control 
                  type="text" 
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  placeholder="e.g., Infrastructure, Sanitation" 
                  className="custom-input" 
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="custom-label">Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="custom-input" 
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="custom-label">Priority Level</Form.Label>
                <Form.Select 
                  name="prioritylevel"
                  value={formData.prioritylevel}
                  onChange={handleChange}
                  className="custom-input"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="custom-label">Location</Form.Label>
                <Form.Control 
                  type="text" 
                  name="mapaddress"
                  value={formData.mapaddress}
                  onChange={handleChange}
                  placeholder="Enter location address" 
                  className="custom-input" 
                />
              </Form.Group>

              <Button type="submit" variant="dark" className="w-100 btn-submit-issue">
                Submit Issue Report
              </Button>
            </Form>
          </div>
        )}

        {/* --- Filters --- */}
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

        {/* --- Issues List --- */}
        {filteredIssues.length === 0 ? (
          <div className="empty-state-card">
            No issues found. Report your first issue!
          </div>
        ) : (
          <div className="issues-list">
            {filteredIssues.map((issue) => (
              <div key={issue.issueid} className="settings-card mb-3 p-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 style={{fontWeight: '700', fontSize: '1.1rem'}}>{issue.title}</h5>
                    <p style={{color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem'}}>{issue.description}</p>
                    <div className="d-flex gap-3 text-muted" style={{fontSize: '0.85rem'}}>
                      <span><MapPin size={14} className="me-1"/> {issue.mapaddress || 'No location'}</span>
                      <span><Clock size={14} className="me-1"/> {new Date(issue.createdat).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`badge bg-${issue.status === 'Resolved' ? 'success' : issue.status === 'In Progress' ? 'warning' : 'secondary'}`}>
                    {issue.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default IssueReports;
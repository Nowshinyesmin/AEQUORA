// frontend/src/pages/ManageIssues/ManageIssues.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BarChart2, 
  Siren, 
  Calendar, 
  Vote, 
  LogOut,
  User,
  Bell // <--- Added Bell icon
} from 'lucide-react';
import { api } from "../../api/client"; 
import './ManageIssues.css';
// Ensure Dashboard CSS is imported for the bell styling consistency
import "../AuthorityDashboard/AuthorityDashboard.css"; 

const ManageIssues = () => {
  const navigate = useNavigate();
  
  // --- States ---
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State to hold the dynamic list of departments
  const [departments, setDepartments] = useState(['Unassigned']); 

  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    username: '',
    role: 'Authority'
  });

  // NEW: Notification Count State
  const [notifCount, setNotifCount] = useState(0);

  // Filter States
  const [filters, setFilters] = useState({
    category: 'All',
    area: 'All',
    urgency: 'All'
  });

  // --- 1. Fetch User Data ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await api.get('auth/users/me/');
        setUserInfo({
          firstName: response.data.firstname || '',
          lastName: response.data.lastname || '',
          username: response.data.username || '',
          role: response.data.role || 'Authority'
        });
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };
    fetchUserData();
  }, [navigate]);

  // --- 2. Fetch Issues, Departments AND Notifications ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [issuesRes, deptRes, notifRes] = await Promise.all([
            api.get('issues/'),              
            api.get('authority/departments/'),
            api.get('authority/notifications/') // Added Notification Fetch
        ]);

        setIssues(issuesRes.data);
        setDepartments(['Unassigned', ...deptRes.data]);
        setNotifCount(notifRes.data.unread_count); // Set count

      } catch (err) {
        console.error("Backend connection failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getDisplayName = () => {
    const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();
    return fullName || userInfo.username || 'Authority User';
  };

  // --- API: Update Status ---
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await api.patch(`issues/${id}/`, { status: newStatus });
      if (response.status === 200) {
        setIssues(issues.map(issue => 
          (issue.id || issue.issueid) === id ? { ...issue, status: response.data.status } : issue
        ));
      }
    } catch (err) {
      alert("Cannot update: Backend is offline or error occurred.");
    }
  };

  // --- API: Assign Department ---
  const handleAssignmentChange = async (id, newDepartment) => {
    try {
      const response = await api.patch(`issues/${id}/`, { assignedTo: newDepartment });
      if (response.status === 200) {
        setIssues(issues.map(issue => 
          (issue.id || issue.issueid) === id ? { ...issue, assignedTo: response.data.assignedTo } : issue
        ));
      }
    } catch (err) {
      alert("Cannot assign: Backend is offline or error occurred.");
    }
  };

  // Handle Filter Inputs
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // --- DYNAMIC FILTER LOGIC ---
  const uniqueCategories = ['All', ...new Set(issues.map(item => item.category || item.type).filter(Boolean))];
  const uniqueAreas = ['All', ...new Set(issues.map(item => item.area || item.mapaddress).filter(Boolean))];

  // Apply Filters
  const filteredIssues = issues.filter(issue => {
    const issueCategory = issue.category || issue.type;
    const categoryMatch = filters.category === 'All' || issueCategory === filters.category;

    const issueArea = issue.area || issue.mapaddress;
    const areaMatch = filters.area === 'All' || issueArea === filters.area;

    const issueUrgency = issue.urgency || issue.prioritylevel;
    const urgencyMatch = filters.urgency === 'All' || issueUrgency === filters.urgency;

    return categoryMatch && areaMatch && urgencyMatch;
  });

  // Helpers for CSS Classes
  const getStatusClass = (status) => {
    switch(status) {
      case 'Pending': return 'status-pending';
      case 'In Progress': return 'status-inprogress';
      case 'Resolved': return 'status-resolved';
      default: return '';
    }
  };

  const getUrgencyClass = (urgency) => {
    const u = (urgency || '').toLowerCase();
    if (u === 'high') return 'urgency-high';
    if (u === 'medium') return 'urgency-medium';
    if (u === 'low') return 'urgency-low';
    return '';
  };

  if (loading) return <div className="manage-issues-root"><div className="manage-main">Loading UI...</div></div>;

  return (
    <div className="manage-issues-root">
      
      {/* --- SIDEBAR --- */}
      <aside className="manage-sidebar">
        <div className="sidebar-brand">
          Aequora
        </div>

        <div className="user-profile-section">
          <div className="user-name-display">
             {getDisplayName()}
          </div>
          <div className="user-role-display">
            {userInfo.role}
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/authority/dashboard" className="nav-link-custom">
            <LayoutDashboard size={20} className="nav-icon" />
            Dashboard
          </Link>
         
          <Link to="/authority/manage-issues" className="nav-link-custom active">
            <ClipboardList size={20} className="nav-icon" />
            Manage Issues
          </Link>
         
          <Link to="/authority/analytics" className="nav-link-custom">
            <BarChart2 size={20} className="nav-icon" />
            Analytics & Reports
          </Link>
         
          <Link to="/authority/events" className="nav-link-custom">
            <Calendar size={20} className="nav-icon" />
            Events & Requests
          </Link>
         
          <Link to="/authority/voting" className="nav-link-custom">
            <Vote size={20} className="nav-icon" />
            Community Voting
          </Link>

          <Link to="/authority/emergency" className="nav-link-custom text-danger">
            <Siren size={20} className="nav-icon" />
            Emergency SOS
          </Link>

           {/* --- Added Profile Link --- */}
           <Link to="/authority/profile" className="nav-link-custom">
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

      {/* --- MAIN CONTENT --- */}
      <main className="manage-main" style={{ position: 'relative' }}>
        
        {/* --- ADDED HEADER RIGHT ACTIONS (Notification Bell) --- */}
        <div className="header-right-actions">
           <div className="notification-wrapper" onClick={() => navigate('/authority/notifications')}>
             <Bell size={24} />
             {notifCount > 0 && <span className="notification-badge">{notifCount}</span>}
           </div>
        </div>

        <div style={{ marginBottom: '2rem', display: 'block' }}>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Manage Issues</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Track, assign, and resolve community reports.</p>
        </div>

        {/* --- Filters Section --- */}
        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select name="category" className="filter-select" value={filters.category} onChange={handleFilterChange}>
              {uniqueCategories.map((cat, index) => (
                <option key={index} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Area</label>
            <select name="area" className="filter-select" value={filters.area} onChange={handleFilterChange}>
              {uniqueAreas.map((area, index) => (
                <option key={index} value={area}>{area === 'All' ? 'All Areas' : area}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Urgency</label>
            <select name="urgency" className="filter-select" value={filters.urgency} onChange={handleFilterChange}>
              <option value="All">All Urgencies</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* --- Issues Table --- */}
        <div className="issues-table-container">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Issue Title</th>
                  <th>Category</th>
                  <th>Area</th>
                  <th>Urgency</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                    <tr key={issue.id || issue.issueid}>
                      <td>#{issue.id || issue.issueid}</td>
                      <td>
                        <div style={{fontWeight: '600'}}>{issue.title}</div>
                      </td>
                      <td>{issue.category || issue.type}</td>
                      <td>{issue.area || issue.mapaddress}</td>
                      <td>
                        <span className={`badge ${getUrgencyClass(issue.urgency || issue.prioritylevel)}`}>
                          {issue.urgency || issue.prioritylevel}
                        </span>
                      </td>
                      <td>
                        <select 
                          className="assign-select"
                          value={issue.assignedTo || ''}
                          onChange={(e) => handleAssignmentChange(issue.id || issue.issueid, e.target.value)}
                        >
                          {departments.map((dept, index) => (
                            <option key={index} value={dept === 'Unassigned' ? '' : dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select 
                          className={`status-select ${getStatusClass(issue.status)}`}
                          value={issue.status}
                          onChange={(e) => handleStatusChange(issue.id || issue.issueid, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-issues">
                      No Issues Found Yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageIssues;
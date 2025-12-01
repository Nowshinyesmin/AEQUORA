// frontend/src/pages/ResidentProfileSettings/ResidentProfileSettings.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, 
  User, MapPin, Users, Save, Shield
} from "lucide-react";
import "./ResidentProfileSettings.css";
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
          firstName: response.data.firstname || '',
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
        <Link to="/report-issue" className="nav-link-custom"><AlertCircle size={20} className="nav-icon" />Report Issue</Link>
        <Link to="/book-service" className="nav-link-custom"><Briefcase size={20} className="nav-icon" />Book Service</Link>
        <Link to="/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" />Events</Link>
        <Link to="/sos" className="nav-link-custom"><Bell size={20} className="nav-icon" />Emergency SOS</Link>
        <Link to="/profile" className="nav-link-custom active"><User size={20} className="nav-icon" />Profile</Link>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button>
      </div>
    </aside>
  );
};

// --- Main Page Component ---
const ResidentProfileSettings = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    date_of_birth: "",
    gender: "",
    emergency_contact: "",
    house_no: "",
    street: "",
    thana: "",
    district: "",
    communityid: "",
    twofactorcode: "", // Added state for 2FA
  });
  
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data on Load
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch User Profile
        const userRes = await api.get('auth/users/me/');
        
        // Fetch List of Communities
        const commRes = await api.get('communities/');
        setCommunities(commRes.data);

        // Pre-fill form
        setFormData({
          firstname: userRes.data.firstname || "",
          lastname: userRes.data.lastname || "",
          date_of_birth: userRes.data.date_of_birth || "",
          gender: userRes.data.gender || "",
          emergency_contact: userRes.data.emergency_contact || "",
          house_no: userRes.data.house_no || "",
          street: userRes.data.street || "",
          thana: userRes.data.thana || "",
          district: userRes.data.district || "",
          communityid: userRes.data.communityid || "",
          twofactorcode: userRes.data.twofactorcode || "", // Load 2FA code
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // 2. Handle Input Changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 3. Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('auth/users/me/', formData);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>Profile Settings</h1>
            <div className="page-subtitle">Manage your personal information</div>
          </div>
        </div>

        {/* --- Personal Info --- */}
        <div className="settings-card">
          <div className="card-header-row"><User size={20} /><span className="card-title-text">Personal Information</span></div>
          <form onSubmit={handleSave}>
            <div className="form-row-grid">
              <div className="form-group">
                <label>First Name</label>
                <input name="firstname" value={formData.firstname} onChange={handleChange} type="text" className="form-control-settings" />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input name="lastname" value={formData.lastname} onChange={handleChange} type="text" className="form-control-settings" />
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label>Date of Birth</label>
                <input name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} type="date" className="form-control-settings" />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="form-control-settings">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            
             <div className="form-group">
                <label>Emergency Contact</label>
                <input name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} type="text" className="form-control-settings" />
             </div>
          </form>
        </div>

        {/* --- Address Info --- */}
        <div className="settings-card">
          <div className="card-header-row"><MapPin size={20} /><span className="card-title-text">Address Information</span></div>
          <div className="form-row-grid">
            <div className="form-group">
              <label>House No.</label>
              <input name="house_no" value={formData.house_no} onChange={handleChange} type="text" className="form-control-settings" />
            </div>
            <div className="form-group">
              <label>Street</label>
              <input name="street" value={formData.street} onChange={handleChange} type="text" className="form-control-settings" />
            </div>
          </div>
          <div className="form-row-grid">
            <div className="form-group">
              <label>Thana</label>
              <input name="thana" value={formData.thana} onChange={handleChange} type="text" className="form-control-settings" />
            </div>
            <div className="form-group">
              <label>District</label>
              <input name="district" value={formData.district} onChange={handleChange} type="text" className="form-control-settings" />
            </div>
          </div>
        </div>

        {/* --- Community Selection --- */}
        <div className="settings-card">
          <div className="card-header-row"><Users size={20} /><span className="card-title-text">Community</span></div>
          <p className="card-description">Select the community you belong to</p>

          <div className="form-group">
            <label>Community</label>
            <select 
              name="communityid" 
              value={formData.communityid} 
              onChange={handleChange} 
              className="form-control-settings"
            >
              <option value="">Select Community</option>
              {communities.map((community) => (
                <option key={community.communityid} value={community.communityid}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Security Settings (Restored) --- */}
        <div className="settings-card">
          <div className="card-header-row">
            <Shield size={20} />
            <span className="card-title-text">Security Settings</span>
          </div>
          <p className="card-description">Two-factor authentication code</p>

          <div className="form-group">
            <label>2FA Code</label>
            <input 
              name="twofactorcode"
              value={formData.twofactorcode}
              onChange={handleChange}
              type="text" 
              className="form-control-settings" 
              placeholder="Enter your 2FA code" 
            />
            <small className="form-text-muted">This code will be used for additional security verification</small>
          </div>
        </div>

        {/* --- Footer Buttons --- */}
        <div className="form-actions">
          <button className="btn-save" onClick={handleSave}>
            <Save size={16} className="me-2" />
            Save Changes
          </button>
        </div>

      </main>
    </div>
  );
};

export default ResidentProfileSettings;
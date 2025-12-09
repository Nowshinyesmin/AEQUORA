// frontend/src/pages/AuthorityProfileSettings/AuthorityProfileSettings.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, ClipboardList, BarChart2, Calendar, Vote, Siren, LogOut, 
  User, MapPin, Save, Shield, Lock, Key, Briefcase, Map
} from "lucide-react";
// Linking to the specific CSS for this page
import "./AuthorityProfileSettings.css";
import { api } from "../../api/client"; 

const AuthoritySidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ firstName: 'Authority', role: 'Authority' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('auth/users/me/'); // Changed to 'me' to ensure consistent name fetching
        setUserInfo({
          firstName: response.data.firstname || 'Admin',
          role: 'Authority'
        });
      } catch (error) {
        console.error("Failed to fetch sidebar info", error);
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
        <div className="user-name-display">{userInfo.firstName}</div>
        <div className="user-role-display">{userInfo.role}</div>
      </div>
      <nav className="sidebar-nav">
        <Link to="/authority/dashboard" className="nav-link-custom">
          <LayoutDashboard size={20} className="nav-icon" />
          Dashboard
        </Link>
        <Link to="/authority/manage-issues" className="nav-link-custom">
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
        <Link to="/authority/profile" className="nav-link-custom active">
          <User size={20} className="nav-icon" />
          Profile Setting
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

const AuthorityProfileSettings = () => {
  const [formData, setFormData] = useState({
    firstname: "", lastname: "", email: "",
    departmentname: "", designation: "", assignedarea: "",
    houseno: "", street: "", thana: "", district: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "", newPassword: "", confirmPassword: ""
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('authority/profile/');
        const data = response.data;
        setFormData({
          firstname: data.firstname || "",
          lastname: data.lastname || "",
          email: data.email || "",
          departmentname: data.departmentname || "",
          designation: data.designation || "",
          assignedarea: data.assignedarea || "",
          houseno: data.houseno || "",
          street: data.street || "",
          thana: data.thana || "",
          district: data.district || ""
        });
      } catch (error) {
        console.error("Error loading authority profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('authority/profile/', formData);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile.");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      await api.post('auth/users/set_password/', {
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      alert("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Password change failed:", error);
      alert("Failed to change password. Check your current password.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <AuthoritySidebar />
      <main className="main-content">
        <div className="page-header">
          <div className="page-title">
            <h1>Authority Profile</h1>
            <div className="page-subtitle">Manage your official information</div>
          </div>
        </div>

        {/* --- Personal & Official Info --- */}
        <div className="settings-card">
          <div className="card-header-row"><User size={20} /><span className="card-title-text">Official Information</span></div>
          <form onSubmit={handleSave}>
            <div className="form-row-grid">
              <div className="form-group"><label>First Name</label><input name="firstname" value={formData.firstname} onChange={handleChange} type="text" className="form-control-settings" /></div>
              <div className="form-group"><label>Last Name</label><input name="lastname" value={formData.lastname} onChange={handleChange} type="text" className="form-control-settings" /></div>
            </div>
            <div className="form-row-grid">
              <div className="form-group"><label>Department Name</label><input name="departmentname" value={formData.departmentname} onChange={handleChange} type="text" className="form-control-settings" placeholder="e.g. Waste Management" /></div>
              <div className="form-group"><label>Designation</label><input name="designation" value={formData.designation} onChange={handleChange} type="text" className="form-control-settings" placeholder="e.g. Senior Officer" /></div>
            </div>
            <div className="form-group"><label>Email (Read Only)</label><input value={formData.email} readOnly disabled type="text" className="form-control-settings" style={{ backgroundColor: '#f3f4f6' }} /></div>
          </form>
        </div>

        {/* --- Office Address Info --- */}
        <div className="settings-card">
          <div className="card-header-row"><Briefcase size={20} /><span className="card-title-text">Office Location</span></div>
          <div className="form-row-grid">
            <div className="form-group"><label>Office House No.</label><input name="houseno" value={formData.houseno} onChange={handleChange} type="text" className="form-control-settings" /></div>
            <div className="form-group"><label>Street</label><input name="street" value={formData.street} onChange={handleChange} type="text" className="form-control-settings" /></div>
          </div>
          <div className="form-row-grid">
            <div className="form-group"><label>Thana</label><input name="thana" value={formData.thana} onChange={handleChange} type="text" className="form-control-settings" /></div>
            <div className="form-group"><label>District</label><input name="district" value={formData.district} onChange={handleChange} type="text" className="form-control-settings" /></div>
          </div>
        </div>

        {/* --- Operational Area --- */}
        <div className="settings-card">
          <div className="card-header-row"><Map size={20} /><span className="card-title-text">Operational Scope</span></div>
          <div className="form-group"><label>Assigned Area</label><input name="assignedarea" value={formData.assignedarea} onChange={handleChange} type="text" className="form-control-settings" placeholder="e.g. Zone 4, North Dhaka" /></div>
        </div>

        {/* --- Password Management --- */}
        <div className="settings-card">
          <div className="card-header-row"><Lock size={20} /><span className="card-title-text">Password Management</span></div>
          <div className="form-group">
            <label>Current Password</label>
            <input name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} type="password" className="form-control-settings" placeholder="Enter current password" />
          </div>
          <div className="form-row-grid">
            <div className="form-group">
              <label>New Password</label>
              <input name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} type="password" className="form-control-settings" placeholder="New password" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} type="password" className="form-control-settings" placeholder="Confirm new password" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-save" style={{ backgroundColor: '#4b5563', border: 'none' }} onClick={handleUpdatePassword}>
              <Key size={16} className="me-2" /> Update Password
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-save" onClick={handleSave}>
            <Save size={16} className="me-2" />
            Save Profile Changes
          </button>
        </div>
      </main>
    </div>
  );
};

export default AuthorityProfileSettings;
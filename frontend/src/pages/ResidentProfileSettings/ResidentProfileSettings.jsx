// frontend/src/pages/ResidentProfileSettings/ResidentProfileSettings.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, 
  User, MapPin, Users, Save, Shield, ThumbsUp, Lock, Key
} from "lucide-react";
import "./ResidentProfileSettings.css";
import { api } from "../../api/client"; 

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
        <Link to="/community-voting" className="nav-link-custom"><ThumbsUp size={20} className="nav-icon" />Community Voting</Link>
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

const ResidentProfileSettings = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: "", lastname: "", date_of_birth: "", gender: "",
    emergency_contact: "", house_no: "", street: "", thana: "",
    district: "", communityid: "", twofactorcode: "", 
  });
  
  // New State for Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "", newPassword: "", confirmPassword: ""
  });

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    localStorage.removeItem('resident_notifications');

    const fetchAllData = async () => {
      try {
        const userRes = await api.get('auth/users/me/');
        const commRes = await api.get('communities/');
        
        setCommunities(commRes.data);
        
        if (userRes.data.userid) {
          setCurrentUserId(userRes.data.userid);
          await fetchBadgeCount(userRes.data.userid);
        }

        setFormData({
          firstname: userRes.data.firstname || "", lastname: userRes.data.lastname || "",
          date_of_birth: userRes.data.date_of_birth || "", gender: userRes.data.gender || "",
          emergency_contact: userRes.data.emergency_contact || "", house_no: userRes.data.house_no || "",
          street: userRes.data.street || "", thana: userRes.data.thana || "",
          district: userRes.data.district || "", communityid: userRes.data.communityid || "",
          twofactorcode: userRes.data.twofactorcode || "", 
        });

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const fetchBadgeCount = async (userId) => {
    try {
      const response = await api.get('resident/notifications/');
      const dbData = response.data.notifications;
      
      const mappedDbNotifs = dbData.map(n => ({
        id: `db-${n.notificationid}`,
        read: n.isread, 
        timestamp: new Date(n.createdat).getTime()
      }));

      const storageKey = `resident_notifications_user_${userId}`;
      const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      const merged = [...localData, ...mappedDbNotifs];
      const totalUnread = merged.filter(n => !n.read).length;

      setNotificationCount(totalUnread);
    } catch (error) {
      console.error("Failed to fetch notification count", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('auth/users/me/', formData);
      if (currentUserId) await fetchBadgeCount(currentUserId);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile.");
    }
  };

  // --- NEW: Password Update Handler ---
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
      
      alert("Password changed successfully! Please use your new password next time you login.");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" }); // Clear fields
    } catch (error) {
      console.error("Password change failed:", error);
      if (error.response && error.response.data.error) {
        alert(error.response.data.error);
      } else {
        alert("Failed to change password. Please check your current password.");
      }
    }
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="header-right-actions">
           <div className="notification-wrapper" onClick={handleNotificationClick}>
             <Bell size={24} />
             {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
           </div>
        </div>

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
              <div className="form-group"><label>First Name</label><input name="firstname" value={formData.firstname} onChange={handleChange} type="text" className="form-control-settings" /></div>
              <div className="form-group"><label>Last Name</label><input name="lastname" value={formData.lastname} onChange={handleChange} type="text" className="form-control-settings" /></div>
            </div>
            <div className="form-row-grid">
              <div className="form-group"><label>Date of Birth</label><input name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} type="date" className="form-control-settings" /></div>
              <div className="form-group"><label>Gender</label><select name="gender" value={formData.gender} onChange={handleChange} className="form-control-settings"><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
            </div>
             <div className="form-group"><label>Emergency Contact</label><input name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} type="text" className="form-control-settings" /></div>
          </form>
        </div>

        {/* --- Address --- */}
        <div className="settings-card">
          <div className="card-header-row"><MapPin size={20} /><span className="card-title-text">Address Information</span></div>
          <div className="form-row-grid">
            <div className="form-group"><label>House No.</label><input name="house_no" value={formData.house_no} onChange={handleChange} type="text" className="form-control-settings" /></div>
            <div className="form-group"><label>Street</label><input name="street" value={formData.street} onChange={handleChange} type="text" className="form-control-settings" /></div>
          </div>
          <div className="form-row-grid">
            <div className="form-group"><label>Thana</label><input name="thana" value={formData.thana} onChange={handleChange} type="text" className="form-control-settings" /></div>
            <div className="form-group"><label>District</label><input name="district" value={formData.district} onChange={handleChange} type="text" className="form-control-settings" /></div>
          </div>
        </div>

        {/* --- Community --- */}
        <div className="settings-card">
          <div className="card-header-row"><Users size={20} /><span className="card-title-text">Community</span></div>
          <div className="form-group">
            <label>Community</label>
            <select name="communityid" value={formData.communityid} onChange={handleChange} className="form-control-settings">
              <option value="">Select Community</option>
              {communities.map((community) => (
                <option key={community.communityid} value={community.communityid}>{community.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* --- Security Settings (2FA) --- */}
        <div className="settings-card">
          <div className="card-header-row"><Shield size={20} /><span className="card-title-text">Security Settings</span></div>
          <div className="form-group"><label>2FA Code</label><input name="twofactorcode" value={formData.twofactorcode} onChange={handleChange} type="text" className="form-control-settings" placeholder="Enter your 2FA code" /></div>
        </div>

        {/* --- NEW: PASSWORD MANAGEMENT --- */}
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
export default ResidentProfileSettings;
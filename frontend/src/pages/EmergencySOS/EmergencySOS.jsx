// frontend/src/pages/EmergencySOS/EmergencySOS.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut,
  Siren, User, TriangleAlert, Phone, Camera
} from "lucide-react";
import "./EmergencySOS.css";
import { api } from "../../api/client"; 

const Sidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ firstName: 'Resident', lastName: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('auth/users/me/');
        setUserInfo({
          firstName: response.data.firstname || 'Resident',
          lastName: response.data.lastname || ''
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
        <div className="user-role-display">Resident</div>
      </div>
      <nav className="sidebar-nav">
        <Link to="/resident/dashboard" className="nav-link-custom"><LayoutDashboard size={20} className="nav-icon" />Dashboard</Link>
        <Link to="/report-issue" className="nav-link-custom"><AlertCircle size={20} className="nav-icon" />Report Issue</Link>
        <Link to="/book-service" className="nav-link-custom"><Briefcase size={20} className="nav-icon" />Book Service</Link>
        <Link to="/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" />Events</Link>
        <Link to="/sos" className="nav-link-custom text-danger-custom active"><Bell size={20} className="nav-icon" />Emergency SOS</Link>
        <Link to="/profile" className="nav-link-custom"><User size={20} className="nav-icon" />Profile</Link>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button>
      </div>
    </aside>
  );
};

const EmergencySOS = () => {
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    emergencytype: "",
    location: "",
    description: ""
  });
  
  // New State for Photo
  const [photo, setPhoto] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if(!formData.emergencytype || !formData.location) {
      alert("Please fill in the Emergency Type and Location.");
      return;
    }

    if (!window.confirm("Are you sure you want to send an Emergency SOS?")) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData object to handle text + file
      const submitData = new FormData();
      submitData.append("emergencytype", formData.emergencytype);
      submitData.append("location", formData.location);
      submitData.append("description", formData.description);
      
      if (photo) {
        submitData.append("photo", photo);
      }

      // Send as multipart/form-data
      await api.post('resident/sos/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert("SOS SENT! Authorities have been alerted.");
      setFormData({ emergencytype: "", location: "", description: "" });
      setPhoto(null); // Reset photo
    } catch (error) {
      console.error("SOS Failed:", error);
      alert("Failed to send SOS. Please call 999.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        
        <div className="sos-page-header">
          <div className="header-icon-wrapper">
            <TriangleAlert size={40} strokeWidth={2.5} />
          </div>
          <h1 className="sos-title">Emergency SOS</h1>
          <p className="sos-subtitle">Report emergencies and get immediate assistance</p>
        </div>

        <div className="emergency-card">
          <div className="emergency-card-header">
            <Bell size={20} />
            <span>Emergency Report Form</span>
          </div>
          
          <div className="emergency-card-body">
            <form onSubmit={handleSubmit}>
              
              <div className="form-group-custom">
                <label className="form-label-custom">Emergency Type *</label>
                <select 
                  className="form-control-custom" 
                  name="emergencytype"
                  value={formData.emergencytype}
                  onChange={handleChange}
                  required 
                >
                  <option value="" disabled>Select emergency type</option>
                  <option value="Fire">Fire</option>
                  <option value="Medical">Medical</option>
                  <option value="Crime">Crime/Security</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group-custom">
                <label className="form-label-custom">Location *</label>
                <input 
                  type="text" 
                  className="form-control-custom" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter exact location"
                  required 
                />
              </div>

              <div className="form-group-custom">
                <label className="form-label-custom">Description</label>
                <textarea 
                  className="form-control-custom" 
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the emergency..."
                ></textarea>
              </div>

              {/* --- New Photo Upload Section --- */}
              <div className="form-group-custom">
                <label className="form-label-custom">Attach Evidence (Optional)</label>
                <div className="file-upload-wrapper">
                  <input 
                    type="file" 
                    className="form-control-custom" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {photo && <small className="text-success mt-1 d-block">Selected: {photo.name}</small>}
                </div>
              </div>

              <div className="warning-box">
                <strong>Important:</strong> Only use for genuine emergencies.
              </div>

              <button 
                type="submit" 
                className="btn-emergency-submit"
                disabled={loading}
              >
                {loading ? "Sending Alert..." : (
                  <>
                    <Siren size={20} />
                    Send Emergency SOS
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmergencySOS;
// frontend/src/pages/EmergencySOS/EmergencySOS.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut,
  Siren, User, TriangleAlert, ThumbsUp, MapPin 
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import "./EmergencySOS.css";
import { api } from "../../api/client"; 
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const Sidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ firstName: 'Resident', lastName: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('auth/users/me/');
        setUserInfo({ firstName: response.data.firstname || 'Resident', lastName: response.data.lastname || '' });
      } catch (error) { console.error(error); }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">Aequora</div>
      <div className="user-profile-section"><div className="user-name-display">{userInfo.firstName} {userInfo.lastName}</div><div className="user-role-display">Resident</div></div>
      <nav className="sidebar-nav">
        <Link to="/resident/dashboard" className="nav-link-custom"><LayoutDashboard size={20} className="nav-icon" />Dashboard</Link>
        <Link to="/report-issue" className="nav-link-custom"><AlertCircle size={20} className="nav-icon" />Report Issue</Link>
        <Link to="/community-voting" className="nav-link-custom"><ThumbsUp size={20} className="nav-icon" />Community Voting</Link>
        <Link to="/book-service" className="nav-link-custom"><Briefcase size={20} className="nav-icon" />Book Service</Link>
        <Link to="/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" />Events</Link>
        <Link to="/sos" className="nav-link-custom text-danger-custom active"><Bell size={20} className="nav-icon" />Emergency SOS</Link>
        <Link to="/profile" className="nav-link-custom"><User size={20} className="nav-icon" />Profile</Link>
      </nav>
      <div className="sidebar-footer"><button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button></div>
    </aside>
  );
};

const LocationMarker = ({ position, setPosition, setAddress, setAddressLoading }) => {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, map.getZoom()); }, [position, map]);
  useMapEvents({
    click(e) {
      const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(newPos);
      setAddressLoading(true);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`)
        .then(res => res.json()).then(data => { setAddress(data.display_name); setAddressLoading(false); })
        .catch(() => { setAddress(`${newPos.lat}, ${newPos.lng}`); setAddressLoading(false); });
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
};

const EmergencySOS = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ emergencytype: "", location: "", description: "" });
  const [photo, setPhoto] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [position, setPosition] = useState({ lat: 23.8103, lng: 90.4125 }); 
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem('resident_notifications');
    const initData = async () => {
        try {
            const userRes = await api.get('auth/users/me/');
            if(userRes.data.userid) {
                setCurrentUserId(userRes.data.userid);
                fetchBadgeCount(userRes.data.userid);
            }
        } catch(e) { console.error(e); }
    };
    initData();
    handleGetLocation(); 
  }, []);

  const fetchBadgeCount = async (userId) => {
    try {
      const response = await api.get('resident/notifications/');
      const dbData = response.data.notifications;
      const mappedDbNotifs = dbData.map(n => ({ id: `db-${n.notificationid}`, read: n.isread }));
      const storageKey = `resident_notifications_user_${userId}`;
      const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const merged = [...localData, ...mappedDbNotifs];
      setNotificationCount(merged.filter(n => !n.read).length);
    } catch (e) { console.error(e); }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setAddressLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(newPos);
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`)
            .then(res => res.json()).then(data => { setFormData(prev => ({ ...prev, location: data.display_name })); setAddressLoading(false); })
            .catch(() => { setFormData(prev => ({ ...prev, location: `${newPos.lat}, ${newPos.lng}` })); setAddressLoading(false); });
        },
        () => { setAddressLoading(false); }
      );
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.emergencytype || !formData.location) { alert("Please fill in Emergency Type and Location."); return; }
    if (!window.confirm("Are you sure you want to send an Emergency SOS?")) return;

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("emergencytype", formData.emergencytype);
      submitData.append("location", formData.location);
      submitData.append("description", formData.description);
      if (photo) submitData.append("photo", photo);

      await api.post('resident/sos/', submitData, { headers: { 'Content-Type': 'multipart/form-data' } });

      // --- REMOVED MANUAL LOCAL STORAGE NOTIFICATION ---
      // DB handles it via signals.py. We just refresh the badge.
      
      alert("SOS SENT! Authorities have been alerted.");
      setFormData({ emergencytype: "", location: "", description: "" });
      setPhoto(null);
      if (currentUserId) fetchBadgeCount(currentUserId);
      
    } catch (error) {
      console.error("SOS Failed:", error);
      alert("Failed to send SOS. Please call 999.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = () => { navigate('/notifications'); };

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
        <div className="sos-page-header">
          <div className="header-icon-wrapper"><TriangleAlert size={40} strokeWidth={2.5} /></div>
          <h1 className="sos-title">Emergency SOS</h1>
          <p className="sos-subtitle">Report emergencies and get immediate assistance</p>
        </div>
        <div className="emergency-card">
          <div className="emergency-card-header"><Bell size={20} /><span>Emergency Report Form</span></div>
          <div className="emergency-card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group-custom"><label className="form-label-custom">Emergency Type *</label><select className="form-control-custom" name="emergencytype" value={formData.emergencytype} onChange={handleChange} required><option value="" disabled>Select emergency type</option><option value="Fire">Fire</option><option value="Medical">Medical</option><option value="Crime">Crime/Security</option><option value="Other">Other</option></select></div>
              <div className="form-group-custom">
                <label className="form-label-custom">Location *</label>
                <div className="d-flex gap-2 mb-2">
                  <input type="text" className="form-control-custom" name="location" value={formData.location} onChange={handleChange} placeholder={addressLoading ? "Detecting location..." : "Enter location or pin on map"} required />
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleGetLocation}><MapPin size={18} /></button>
                </div>
                <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd', zIndex: 0 }}>
                  <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker position={position} setPosition={setPosition} setAddress={(addr) => setFormData(prev => ({...prev, location: addr}))} setAddressLoading={setAddressLoading} />
                  </MapContainer>
                </div>
              </div>
              <div className="form-group-custom"><label className="form-label-custom">Description</label><textarea className="form-control-custom" rows={3} name="description" value={formData.description} onChange={handleChange} placeholder="Describe the emergency..."></textarea></div>
              <div className="form-group-custom"><label className="form-label-custom">Attach Evidence (Optional)</label><div className="file-upload-wrapper"><input type="file" className="form-control-custom" accept="image/*" onChange={handleFileChange} />{photo && <small className="text-success mt-1 d-block">Selected: {photo.name}</small>}</div></div>
              <div className="warning-box"><strong>Important:</strong> Only use for genuine emergencies.</div>
              <button type="submit" className="btn-emergency-submit" disabled={loading}>{loading ? "Sending Alert..." : <><Siren size={20} />Send Emergency SOS</>}</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
export default EmergencySOS;
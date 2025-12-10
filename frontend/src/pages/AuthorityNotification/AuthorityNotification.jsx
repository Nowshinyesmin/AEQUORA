import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, ClipboardList, BarChart2, Calendar, Vote, Siren, LogOut, 
  User, Bell, CheckCircle, AlertTriangle, Calendar as CalIcon, Info, CheckSquare
} from "lucide-react";
import { api } from "../../api/client"; 
import "./AuthorityNotification.css"; // Now importing its own CSS file

// --- Internal Sidebar Component (Specific to Authority) ---
const AuthoritySidebar = ({ userInfo }) => {
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">Aequora</div>
      <div className="user-profile-section">
        <div className="user-name-display">{userInfo.firstName} {userInfo.lastName}</div>
        <div className="user-role-display">{userInfo.role}</div>
      </div>
      <nav className="sidebar-nav">
        <Link to="/authority/dashboard" className="nav-link-custom"><LayoutDashboard size={20} className="nav-icon" />Dashboard</Link>
        <Link to="/authority/manage-issues" className="nav-link-custom"><ClipboardList size={20} className="nav-icon" />Manage Issues</Link>
        <Link to="/authority/analytics" className="nav-link-custom"><BarChart2 size={20} className="nav-icon" />Analytics & Reports</Link>
        <Link to="/authority/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" />Events & Requests</Link>
        <Link to="/authority/voting" className="nav-link-custom"><Vote size={20} className="nav-icon" />Community Voting</Link>
        <Link to="/authority/emergency" className="nav-link-custom text-danger"><Siren size={20} className="nav-icon" />Emergency SOS</Link>
        <Link to="/authority/profile" className="nav-link-custom"><User size={20} className="nav-icon" />Profile</Link>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button>
      </div>
    </aside>
  );
};

const AuthorityNotification = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({ firstName: 'Authority', lastName: '', role: 'Authority' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const [userRes, notifRes] = await Promise.all([
          api.get('auth/users/me/'),
          api.get('authority/notifications/')
        ]);

        setUserInfo({
          firstName: userRes.data.firstname || '',
          lastName: userRes.data.lastname || '',
          role: userRes.data.role || 'Authority'
        });

        // Backend returns { unread_count: int, notifications: [...] }
        setNotifications(notifRes.data.notifications);
        setNotifCount(notifRes.data.unread_count);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const markAllAsRead = async () => {
    try {
      await api.post('authority/notifications/'); // Mark read in DB
      
      // Update UI locally
      const updated = notifications.map(n => ({ ...n, isread: true }));
      setNotifications(updated);
      setNotifCount(0);
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  const handleCardClick = (link) => {
    if (link) navigate(link);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'sos': return <Siren size={20} className="text-danger" />;
      case 'issue': return <ClipboardList size={20} className="text-warning" />;
      case 'event': return <CalIcon size={20} className="text-primary" />;
      case 'vote': return <Vote size={20} className="text-info" />;
      default: return <Info size={20} className="text-secondary" />;
    }
  };

  return (
    <div className="dashboard-container">
      <AuthoritySidebar userInfo={userInfo} />
      <main className="main-content">
        
        {/* Header Actions */}
        <div className="header-right-actions">
           {notifCount > 0 && (
             <button className="mark-read-btn" onClick={markAllAsRead}>
               Mark all as read
             </button>
           )}
           <div className="notification-wrapper">
             <Bell size={24} />
             {notifCount > 0 && <span className="notification-badge">{notifCount}</span>}
           </div>
        </div>

        <div className="page-header">
            <div className="page-title">
                <h1>Notifications</h1>
                <div className="page-subtitle">System alerts and community updates</div>
            </div>
        </div>

        <div className="notification-list">
          {loading ? (
             <div className="p-4 text-center text-muted">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state-card">No notifications found.</div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.notificationid} 
                className={`notification-card ${notif.isread ? 'read' : 'unread'}`}
                onClick={() => handleCardClick(notif.link)}
                style={{ cursor: notif.link ? 'pointer' : 'default' }}
              >
                <div className="notif-icon-box">
                  {getIcon(notif.type)}
                </div>
                <div className="notif-content">
                  <p className="notif-message">{notif.message}</p>
                  <span className="notif-time">{new Date(notif.createdat).toLocaleString()}</span>
                </div>
                {!notif.isread && <div className="unread-dot"></div>}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthorityNotification;
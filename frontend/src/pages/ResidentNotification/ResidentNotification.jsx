import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, 
  User, CheckCircle, Info, AlertTriangle, ThumbsUp, CheckSquare
} from "lucide-react";
import "./ResidentNotification.css";
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
        <Link to="/community-voting" className="nav-link-custom"><ThumbsUp size={20} className="nav-icon" />Community Voting</Link>
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

const ResidentNotification = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null); 

  useEffect(() => {
    // CLEANUP: Remove old shared key to prevent merging issues
    localStorage.removeItem('resident_notifications');

    const initUserData = async () => {
      try {
        const response = await api.get('auth/users/me/');
        if (response.data && response.data.userid) {
            const uid = response.data.userid;
            setCurrentUserId(uid);
            // Fetch notifications for this specific user
            fetchNotifications(uid); 
        }
      } catch (error) {
        console.error("Failed to fetch user info for notifications", error);
        setLoading(false);
      }
    };
    initUserData();
  }, []);

  // Helper: Format Date and Time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true
    });
  };

  const fetchNotifications = async (userId) => {
    if (!userId) return;

    try {
      // 1. Fetch REAL Database Notifications
      const response = await api.get('resident/notifications/');
      const dbData = response.data.notifications;
      
      // 2. Map DB format to UI format
      const mappedDbNotifs = dbData.map(n => ({
        id: `db-${n.notificationid}`,
        type: n.type,
        message: n.message,
        date: formatDateTime(n.createdat),
        timestamp: new Date(n.createdat).getTime(),
        read: n.isread, // Respect DB read status
        link: n.link
      }));

      // 3. Process Local Storage (Unique Key per User)
      const storageKey = `resident_notifications_user_${userId}`;
      const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');

      // 4. Merge and Sort (Newest First)
      const merged = [...localData, ...mappedDbNotifs].sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeB - timeA; 
      });

      setNotifications(merged);

      // 5. STRICT COUNTING: 
      // Count is derived purely from items where read === false.
      // Since we don't update 'read' on page load, this count persists.
      const totalUnread = merged.filter(n => !n.read).length;
      setNotificationCount(totalUnread);

    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  // --- STRICT NAVIGATE ONLY ---
  // Clicking a card navigates but DOES NOT mark as read.
  const handleCardClick = (link) => {
    if (link) {
        navigate(link);
    }
    // We purposefully do NOT update state here. 
    // The notification remains "unread" until the "Mark all" button is clicked.
  };

  const markAllAsRead = async () => {
    if (!currentUserId) return;

    try {
        // 1. Backend Update
        await api.post('resident/notifications/');

        // 2. UI Update (Visual)
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        
        // 3. Force Count to Zero
        setNotificationCount(0); 

        // 4. Local Storage Update
        const storageKey = `resident_notifications_user_${currentUserId}`;
        const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const markedLocal = localData.map(n => ({ ...n, read: true }));
        localStorage.setItem(storageKey, JSON.stringify(markedLocal));

    } catch (error) {
        console.error("Failed to mark notifications as read", error);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'booking': return <CheckCircle size={20} className="text-success" />;
      case 'sos': return <AlertTriangle size={20} className="text-danger" />;
      case 'sos-sent': return <Bell size={20} className="text-danger" />;
      case 'vote': return <ThumbsUp size={20} className="text-primary" />;
      case 'profile': return <User size={20} className="text-primary" />;
      
      case 'issue': 
      case 'issue-resolved': return <CheckSquare size={20} className="text-success" />;
      
      case 'event':
      case 'new-event': return <Calendar size={20} className="text-warning" />;
      
      default: return <Info size={20} className="text-info" />;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        
        <div className="header-right-actions">
           {notificationCount > 0 && (
             <button className="mark-read-btn" onClick={markAllAsRead}>
               Mark all as read
             </button>
           )}
           <div className="notification-wrapper">
             <Bell size={24} />
             {notificationCount > 0 && (
               <span className="notification-badge">{notificationCount}</span>
             )}
           </div>
        </div>

        <div className="page-header d-flex justify-content-between align-items-center">
          <div className="page-title">
            <h1>Notifications</h1>
            <div className="page-subtitle">Stay updated with your community</div>
          </div>
        </div>

        <div className="notification-list">
          {loading ? (
             <div className="p-4 text-center text-muted">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state-card">
              You have no notifications.
            </div>
          ) : (
            notifications.map((notif, index) => (
              <div 
                key={notif.id || index} 
                className={`notification-card ${notif.read ? 'read' : 'unread'}`}
                // Using helper function to ensure we navigate but don't mark as read
                onClick={() => handleCardClick(notif.link)}
                style={{ cursor: notif.link ? 'pointer' : 'default' }}
              >
                <div className="notif-icon-box">
                  {getIcon(notif.type)}
                </div>
                <div className="notif-content">
                  <p className="notif-message">{notif.message}</p>
                  <span className="notif-time">{notif.date}</span>
                </div>
                {!notif.read && <div className="unread-dot"></div>}
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
};

export default ResidentNotification;
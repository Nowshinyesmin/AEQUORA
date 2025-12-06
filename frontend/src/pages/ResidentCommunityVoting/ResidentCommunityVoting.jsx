// frontend/src/pages/ResidentCommunityVoting/ResidentCommunityVoting.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, AlertCircle, Briefcase, Calendar, Bell, LogOut, User, MapPin, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import "./ResidentCommunityVoting.css";
import { api } from "../../api/client"; 

const Sidebar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ firstName: 'Resident', lastName: '' });
  useEffect(() => {
    const fetchUserData = async () => { try { const response = await api.get('auth/users/me/'); setUserInfo({ firstName: response.data.firstname || 'Resident', lastName: response.data.lastname || '' }); } catch (error) { console.error(error); } };
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
        <Link to="/community-voting" className="nav-link-custom active"><ThumbsUp size={20} className="nav-icon" />Community Voting</Link>
        <Link to="/book-service" className="nav-link-custom"><Briefcase size={20} className="nav-icon" />Book Service</Link>
        <Link to="/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" />Events</Link>
        <Link to="/sos" className="nav-link-custom"><Bell size={20} className="nav-icon" />Emergency SOS</Link>
        <Link to="/profile" className="nav-link-custom"><User size={20} className="nav-icon" />Profile</Link>
      </nav>
      <div className="sidebar-footer"><button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" />Logout</button></div>
    </aside>
  );
};

const ResidentCommunityVoting = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

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
    fetchIssues();
  }, []);

  const fetchIssues = async () => { try { const response = await api.get('resident/community-issues/'); const initializedIssues = response.data.map(issue => ({ ...issue, upvotes: issue.upvotes || 0, downvotes: issue.downvotes || 0, userVote: issue.user_vote })); setIssues(initializedIssues); } catch (error) { console.error("Failed to fetch issues:", error); } finally { setLoading(false); } };

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

  const handleVote = async (issueId, type) => {
    const issueIndex = issues.findIndex(i => i.issueid === issueId);
    if (issueIndex === -1) return;
    const previousIssues = [...issues];
    const issue = issues[issueIndex];
    let newUpvotes = issue.upvotes; let newDownvotes = issue.downvotes; let newUserVote = issue.userVote; let voteAction = null;
    if (type === 'up') { if (newUserVote === 'up') { newUserVote = null; newUpvotes--; } else { if (newUserVote === 'down') newDownvotes--; newUserVote = 'up'; newUpvotes++; voteAction = "upvoted"; } } else if (type === 'down') { if (newUserVote === 'down') { newUserVote = null; newDownvotes--; } else { if (newUserVote === 'up') newUpvotes--; newUserVote = 'down'; newDownvotes++; voteAction = "downvoted"; } }
    const updatedIssues = [...issues];
    updatedIssues[issueIndex] = { ...issue, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote };
    setIssues(updatedIssues);
    try {
      await api.post('resident/vote/', { issueid: issueId, type: type });
      // --- REMOVED MANUAL LOCAL STORAGE NOTIFICATION ---
      // DB handles it.
      if (voteAction && currentUserId) fetchBadgeCount(currentUserId);
    } catch (error) { console.error("Vote failed:", error); setIssues(previousIssues); alert("Failed to record vote."); }
  };

  const goToNotifications = () => { navigate('/notifications'); };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="header-right-actions">
           <div className="notification-wrapper" onClick={goToNotifications}>
             <Bell size={24} />
             {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
           </div>
        </div>
        <div className="page-header"><div className="page-title"><h1>Community Voting</h1><div className="page-subtitle">Vote on issues to prioritize community fixes</div></div></div>
        {loading ? <div>Loading issues...</div> : issues.length === 0 ? <div className="empty-state-card">No community issues available for voting yet.</div> : (
          <div className="voting-list">
            {issues.map((issue) => (
              <div key={issue.issueid} className="voting-card">
                <div className="voting-content">
                  <div className="d-flex justify-content-between align-items-start"><h5 className="voting-title">{issue.title}</h5><span className={`badge bg-${issue.status === 'Resolved' ? 'success' : issue.status === 'In Progress' ? 'warning' : 'secondary'}`}>{issue.status}</span></div>
                  <p className="voting-desc">{issue.description}</p>
                  <div className="voting-meta"><span><MapPin size={14} className="me-1"/> {issue.mapaddress || 'No location'}</span><span><Clock size={14} className="me-1"/> {new Date(issue.createdat).toLocaleDateString()}</span><span><User size={14} className="me-1"/> Reported by: {issue.resident_name || 'Neighbor'}</span></div>
                  <div className="vote-controls-horizontal mt-3">
                    <div className="vote-group"><button className={`vote-btn ${issue.userVote === 'up' ? 'active-red' : ''}`} onClick={() => handleVote(issue.issueid, 'up')}><ThumbsUp size={18} /></button><span className="vote-label">Upvote</span><span className="vote-count-value">{issue.upvotes}</span></div>
                    <div className="vote-group"><button className={`vote-btn ${issue.userVote === 'down' ? 'active-red' : ''}`} onClick={() => handleVote(issue.issueid, 'down')}><ThumbsDown size={18} /></button><span className="vote-label">Downvote</span><span className="vote-count-value">{issue.downvotes}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
export default ResidentCommunityVoting;
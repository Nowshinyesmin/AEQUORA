// frontend/src/pages/CommunityVoting/CommunityVoting.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, BarChart2, Siren, Calendar, Vote, LogOut,
  ThumbsUp, TrendingUp, AlertTriangle, ArrowUp, Trophy, ListFilter
} from 'lucide-react';
import { api } from "../../api/client"; 
import './CommunityVoting.css';

const CommunityVoting = () => {
  const navigate = useNavigate();
  const [votingData, setVotingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('top10'); 
  const [sortOrder, setSortOrder] = useState('desc'); 

  // --- User Info State ---
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    username: '',
    role: 'Authority'
  });

  // --- 1. Fetch User Data (FIXED VARIABLE NAMES) ---
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
          // FIXED: Backend uses 'firstname', not 'first_name'
          firstName: response.data.firstname || '',
          // FIXED: Backend uses 'lastname', not 'last_name'
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

  // --- 2. Fetch Voting Results ---
  useEffect(() => {
    const fetchVotingResults = async () => {
      try {
        const response = await api.get('authority/voting-results/');
        setVotingData(response.data);
      } catch (err) {
        console.error("Backend not running or endpoint missing:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVotingResults();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getDisplayName = () => {
    const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();
    return fullName || userInfo.username || 'Authority User';
  };

  const getSortedData = () => {
    const dataCopy = [...votingData];
    return dataCopy.sort((a, b) => {
      const votesA = a.vote_count || 0;
      const votesB = b.vote_count || 0;
      return sortOrder === 'desc' ? votesB - votesA : votesA - votesB;
    });
  };

  const getDisplayData = () => {
    const sorted = getSortedData();
    if (activeTab === 'top10') {
      return sorted.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 10);
    }
    return sorted; 
  };

  const displayIssues = getDisplayData();
  const totalVotes = votingData.reduce((acc, curr) => acc + (curr.vote_count || 0), 0);
  const topIssue = votingData.length > 0 ? [...votingData].sort((a,b) => b.vote_count - a.vote_count)[0] : null;

  const getUrgencyClass = (urgency) => {
    const u = (urgency || '').toLowerCase();
    if (u === 'high') return 'urgency-high';
    if (u === 'medium') return 'urgency-medium';
    if (u === 'low') return 'urgency-low';
    return '';
  };

  if (loading) return <div className="voting-root"><div className="voting-main">Loading Voting Data...</div></div>;

  return (
    <div className="voting-root">
      
      {/* --- SIDEBAR --- */}
      <aside className="voting-sidebar">
        <div className="sidebar-brand">Aequora</div>
        <div className="user-profile-section">
          <div className="user-name-display">{getDisplayName()}</div>
          <div className="user-role-display">{userInfo.role}</div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/authority/dashboard" className="nav-link-custom"><LayoutDashboard size={20} className="nav-icon" /> Dashboard</Link>
          <Link to="/authority/manage-issues" className="nav-link-custom"><ClipboardList size={20} className="nav-icon" /> Manage Issues</Link>
          <Link to="/authority/analytics" className="nav-link-custom"><BarChart2 size={20} className="nav-icon" /> Analytics & Reports</Link>
          <Link to="/authority/events" className="nav-link-custom"><Calendar size={20} className="nav-icon" /> Events & Requests</Link>
          <Link to="/authority/voting" className="nav-link-custom active"><Vote size={20} className="nav-icon" /> Community Voting</Link>
          <Link to="/authority/emergency" className="nav-link-custom text-danger"><Siren size={20} className="nav-icon" /> Emergency SOS</Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn"><LogOut size={18} className="me-2" /> Logout</button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="voting-main">
        
        <div className="page-header-block">
          <h1 className="page-title">Community Voting Results</h1>
          <p className="page-subtitle">Prioritize community actions based on resident upvotes.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper blue-bg">
              <ThumbsUp size={24} className="text-blue" />
            </div>
            <div className="stat-content">
              <h3>Total Upvotes</h3>
              <p className="stat-number">{totalVotes}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper green-bg">
              <TrendingUp size={24} className="text-green" />
            </div>
            <div className="stat-content">
              <h3>Top Priority Issue</h3>
              <p className="stat-text-sm">{topIssue ? topIssue.title : "No votes yet"}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper orange-bg">
              <AlertTriangle size={24} className="text-orange" />
            </div>
            <div className="stat-content">
              <h3>Action Required</h3>
              <p className="stat-text-sm">
                {votingData.filter(i => (i.vote_count > 5) && i.status !== 'Resolved').length} Issues highly voted
              </p>
            </div>
          </div>
        </div>

        <div className="controls-container">
          <div className="tabs-wrapper">
            <button 
              className={`tab-btn ${activeTab === 'top10' ? 'active' : ''}`} 
              onClick={() => setActiveTab('top10')}
            >
              <Trophy size={16} />
              Top 10 Priority
            </button>
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} 
              onClick={() => setActiveTab('all')}
            >
              <ListFilter size={16} />
              All Issues List
            </button>
          </div>

          {activeTab === 'all' && (
            <div className="sort-wrapper">
              <span className="sort-label">Sort By:</span>
              <select 
                className="sort-select" 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Most Upvoted (High to Low)</option>
                <option value="asc">Least Upvoted (Low to High)</option>
              </select>
            </div>
          )}
        </div>

        <div className="voting-table-container">
          <div className="table-header-row">
            <h3>{activeTab === 'top10' ? 'Top 10 Priority Issues' : 'All Issues List'}</h3>
            {activeTab === 'top10' && <span className="live-badge">Top Priority</span>}
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Vote Count</th>
                  <th>Issue Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Reported</th>
                </tr>
              </thead>
              <tbody>
                {displayIssues.length > 0 ? (
                  displayIssues.map((issue, index) => (
                    <tr key={issue.issueid || index}>
                      <td>
                        <div className={`rank-circle ${index < 3 && (activeTab === 'top10' || sortOrder === 'desc') ? 'top-rank' : ''}`}>
                          #{index + 1}
                        </div>
                      </td>
                      <td>
                        <div className="vote-count-cell">
                          <ArrowUp size={16} className="vote-arrow"/>
                          <span>{issue.vote_count || 0}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{fontWeight: '600', color: '#111827'}}>{issue.title}</div>
                        <div style={{fontSize: '0.85rem', color: '#6b7280'}}>{issue.mapaddress}</div>
                      </td>
                      <td>{issue.type || 'General'}</td>
                      <td>
                        <span className={`badge ${getUrgencyClass(issue.prioritylevel)}`}>
                          {issue.prioritylevel || 'Medium'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-text ${issue.status === 'Resolved' ? 'text-success' : 'text-primary'}`}>
                          {issue.status || 'Pending'}
                        </span>
                      </td>
                      <td>{new Date(issue.createdat).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No issues found for this view.
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

export default CommunityVoting;
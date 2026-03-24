import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ResourceCard from '../components/ResourceCard';
import { fetchResources, unifiedSearch } from '../api';
import { useAuth } from '../context/AuthContext';
import { FiBook, FiCpu, FiMessageCircle, FiCode, FiArrowRight, FiFileText } from 'react-icons/fi';

export default function Dashboard() {
  const [resources, setResources] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const res = await fetchResources({ limit: 8 });
      setResources(res.data.resources || []);
    } catch { }
    setLoading(false);
  };

  const handleSearch = async (query) => {
    setLoading(true);
    try {
      const res = await unifiedSearch(query);
      setSearchResults(res.data.results || []);
    } catch { setSearchResults([]); }
    setLoading(false);
  };

  const quickLinks = [
    { icon: <FiBook />, label: 'Knowledge Hub', desc: 'Browse notes & papers', path: '/knowledge', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
    { icon: <FiCpu />, label: 'Lab Resources', desc: 'Experiments & code', path: '/lab', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    { icon: <FiMessageCircle />, label: 'AI Assistant', desc: 'Ask anything', path: '/chat', gradient: 'linear-gradient(135deg, #34d399, #059669)' },
    { icon: <FiFileText />, label: 'Conceptify Assist', desc: 'Papers to Answers', path: '/assist', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
    { icon: <FiCode />, label: 'Debug Helper', desc: 'Fix your code', path: '/debug', gradient: 'linear-gradient(135deg, #f472b6, #db2777)' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name?.split(' ')[0] || 'Student'}</h1>
        <p>Your intelligent academic assistant — search notes, labs, and get AI-powered help.</p>
      </div>

      <div style={{ marginBottom: 40 }}>
        <SearchBar onSearch={handleSearch} placeholder="Search concepts, notes, experiments, code..." />
      </div>

      {/* Quick Access Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {quickLinks.map((item) => (
          <div
            key={item.path}
            className="glass-card"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
            onClick={() => navigate(item.path)}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: item.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', flexShrink: 0
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-bright)' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
            </div>
            <FiArrowRight style={{ color: 'var(--text-muted)' }} />
          </div>
        ))}
      </div>

      {/* Search Results or Recent Resources */}
      {searchResults !== null ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Search Results ({searchResults.length})</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setSearchResults(null)}>Clear</button>
          </div>
        {searchResults.length > 0 ? (
            <div className="resource-grid">
              {searchResults.map((item, i) => (
                <ResourceCard
                  key={item.resource_id || i}
                  resource={{
                    id: item.resource_id,
                    title: item.title,
                    subject: item.subject,
                    topic: item.topic,
                    file_type: item.file_type,
                    file_path: item.file_path,
                    description: item.description || item.snippet,
                    ai_summary: item.search_type === 'semantic' ? `🧠 AI Match (${Math.round((item.score || 0) * 100)}% relevant)` : '',
                  }}
                  onClick={() => navigate('/knowledge')}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No results found</h3>
              <p>Try different keywords or ask the AI assistant</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Recent Resources</h2>
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : resources.length > 0 ? (
            <div className="resource-grid">
              {resources.map((r) => (
                <ResourceCard key={r.id} resource={r} onClick={() => navigate('/knowledge')} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No resources yet</h3>
              <p>Faculty can upload notes, slides, and lab materials</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

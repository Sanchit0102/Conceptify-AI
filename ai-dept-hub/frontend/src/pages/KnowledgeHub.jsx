import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import ResourceCard from '../components/ResourceCard';
import { fetchResources, searchResources, getFileUrl, deleteResource } from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function KnowledgeHub() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadResources(); }, [filter]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filter !== 'all') params.file_type = filter;
      const res = await fetchResources(params);
      setResources(res.data.resources || []);
    } catch { }
    setLoading(false);
  };

  const handleSearch = async (query) => {
    setLoading(true);
    try {
      const res = await searchResources(query);
      setResources(res.data.results || []);
    } catch { setResources([]); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to completely delete this resource?')) return;
    try {
      await deleteResource(id);
      toast.success('Resource deleted successfully.');
      setSelected(null);
      loadResources();
    } catch {
      toast.error('Failed to delete resource.');
    }
  };

  const fileTypes = [
    { value: 'all', label: 'All' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'slides', label: 'Slides' },
    { value: 'code', label: 'Code' },
    { value: 'lab_manual', label: 'Lab Manuals' },
    { value: 'question_paper', label: 'Papers' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Knowledge Hub</h1>
        <p>Browse and search department notes, PDFs, slides, and reference materials</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <SearchBar onSearch={handleSearch} placeholder="Search by concept, subject, or topic..." />
      </div>

      <div className="tabs">
        {fileTypes.map((t) => (
          <button
            key={t.value}
            className={`tab ${filter === t.value ? 'active' : ''}`}
            onClick={() => { setFilter(t.value); setSelected(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Detail View */}
      {selected && (
        <div className="glass-card-static" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 8 }}>{selected.title}</h2>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>📚 {selected.subject}</span>
                {selected.topic && <span>📌 {selected.topic}</span>}
                <span>📅 {new Date(selected.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕ Close</button>
          </div>
          {selected.description && <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{selected.description}</p>}
          {selected.ai_summary && (
            <div style={{ padding: 16, background: 'rgba(139, 92, 246, 0.06)', borderLeft: '3px solid var(--violet-500)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', marginBottom: 16 }}>
              <strong style={{ color: 'var(--text-accent)', fontSize: 13 }}>✨ AI Summary</strong>
              <div className="markdown-body" style={{ marginTop: 8 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.ai_summary}</ReactMarkdown>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {selected.file_path && (
              <a href={getFileUrl(selected.file_path)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                📥 Download File
              </a>
            )}
            {isAdmin && (
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>
                🗑️ Delete Resource
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : resources.length > 0 ? (
        <div className="resource-grid">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} onClick={setSelected} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No resources found</h3>
          <p>Try a different search or filter</p>
        </div>
      )}
    </div>
  );
}

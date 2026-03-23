import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import ResourceCard from '../components/ResourceCard';
import CodeViewer from '../components/CodeViewer';
import { fetchResources, searchResources, getFileUrl, deleteResource } from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LabHub() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [codeContent, setCodeContent] = useState('');
  const [langFilter, setLangFilter] = useState('all');

  useEffect(() => { loadResources(); }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await fetchResources({ file_type: 'code', limit: 50 });
      let allResources = res.data.resources || [];
      // Also get lab manuals
      const labRes = await fetchResources({ file_type: 'lab_manual', limit: 50 });
      allResources = [...allResources, ...(labRes.data.resources || [])];
      setResources(allResources);
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

  const handleSelect = async (resource) => {
    setSelected(resource);
    // Try to fetch code content if it's a code file
    if (resource.file_type === 'code' && resource.file_path) {
      try {
        const response = await fetch(getFileUrl(resource.file_path));
        const text = await response.text();
        setCodeContent(text);
      } catch {
        setCodeContent('// Could not load code file');
      }
    } else {
      setCodeContent('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to completely delete this lab resource?')) return;
    try {
      await deleteResource(id);
      toast.success('Resource deleted successfully.');
      setSelected(null);
      loadResources();
    } catch {
      toast.error('Failed to delete resource.');
    }
  };

  const languages = [
    { value: 'all', label: 'All Languages' },
    { value: 'python', label: 'Python' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Smart Lab Resource Hub</h1>
        <p>Browse lab experiments, code examples, algorithms, and practical implementations</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <SearchBar onSearch={handleSearch} placeholder="Search lab experiments, e.g. 'Linked List', 'Binary Search'..." />
      </div>

      <div className="tabs">
        {languages.map((l) => (
          <button key={l.value} className={`tab ${langFilter === l.value ? 'active' : ''}`}
            onClick={() => setLangFilter(l.value)}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Code Viewer */}
      {selected && (
        <div className="glass-card-static" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-bright)' }}>{selected.title}</h2>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>📚 {selected.subject}</span>
                {selected.topic && <span>📌 {selected.topic}</span>}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(null); setCodeContent(''); }}>✕ Close</button>
          </div>
          {selected.description && <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>{selected.description}</p>}
          {selected.ai_summary && (
            <div style={{ padding: 16, background: 'rgba(52, 211, 153, 0.06)', borderLeft: '3px solid var(--green-400)', borderRadius: '0 8px 8px 0', marginBottom: 16 }}>
              <strong style={{ color: 'var(--green-400)', fontSize: 13 }}>🤖 AI Explanation</strong>
              <div className="markdown-body" style={{ marginTop: 8 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.ai_summary}</ReactMarkdown>
              </div>
            </div>
          )}
          {codeContent && <CodeViewer code={codeContent} language={selected.topic?.toLowerCase() || 'python'} />}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {selected.file_path && (
              <a href={getFileUrl(selected.file_path)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                📥 Download
              </a>
            )}
            {isAdmin && (
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>
                🗑️ Delete
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
            <ResourceCard key={r.id} resource={r} onClick={handleSelect} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔬</div>
          <h3>No lab resources found</h3>
          <p>Search for experiments or ask faculty to upload lab materials</p>
        </div>
      )}
    </div>
  );
}

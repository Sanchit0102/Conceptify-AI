import { useState, useEffect } from 'react';
import { fetchAnalytics, uploadResource, createTopic, fetchTopics, fetchUsers, promoteUser, removeUser } from '../api';
import toast from 'react-hot-toast';
import { FiUpload, FiBarChart2, FiPlusCircle, FiUsers, FiSearch, FiBook, FiMessageCircle, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('Analytics');
  const [analytics, setAnalytics] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload form
  const [uploadForm, setUploadForm] = useState({ title: '', subject: '', topic: '', description: '', file_type: 'pdf', target_class: 'All', file: null });
  const [uploading, setUploading] = useState(false);

  // Topic form
  const [topicForm, setTopicForm] = useState({ subject: '', topic_name: '', keywords: '' });

  const [usersList, setUsersList] = useState([]);
  const [userTab, setUserTab] = useState('FE'); // Faculty, FE, SE, TE, BE 

  useEffect(() => {
    loadData();
  }, []);

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetchUsers();
      setUsersList(res.data);
    } catch {
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const [analyticsRes, topicsRes] = await Promise.all([
        fetchAnalytics().catch(() => ({ data: {} })),
        fetchTopics().catch(() => ({ data: [] })),
      ]);
      setAnalytics(analyticsRes.data);
      setTopics(topicsRes.data || []);
    } catch { }
    setLoading(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return toast.error('Please select a file');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('subject', uploadForm.subject);
      formData.append('topic', uploadForm.topic);
      formData.append('description', uploadForm.description);
      formData.append('file_type', uploadForm.file_type);
      formData.append('target_class', uploadForm.target_class);
      await uploadResource(formData);
      toast.success('Resource uploaded successfully!');
      setUploadForm({ title: '', subject: '', topic: '', description: '', file_type: 'pdf', target_class: 'All', file: null });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    }
    setUploading(false);
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    try {
      await createTopic({
        subject: topicForm.subject,
        topic_name: topicForm.topic_name,
        keywords: topicForm.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      });
      toast.success('Topic created!');
      setTopicForm({ subject: '', topic_name: '', keywords: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create topic');
    }
  };

  const handlePromote = async (userId) => {
    try {
      await promoteUser(userId);
      toast.success('User promoted to faculty!');
      loadUsers();
    } catch {
      toast.error('Failed to promote user');
    }
  };

  const handleRemoveUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to completely remove the user "${name}"? This action cannot be undone.`)) return;
    try {
      await removeUser(userId);
      toast.success('User removed successfully!');
      loadUsers();
    } catch {
      toast.error('Failed to remove user');
    }
  };

  const tabs = [
    { id: 'Analytics', label: 'Analytics', icon: <FiBarChart2 /> },
    { id: 'upload', label: 'Upload', icon: <FiUpload /> },
    { id: 'topics', label: 'Topics', icon: <FiPlusCircle /> },
    ...(isAdmin ? [{ id: 'users', label: 'Manage Users', icon: <FiShield /> }] : []),
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Faculty Dashboard</h1>
        <p>Upload resources, manage topics, and view student engagement analytics</p>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.icon} <span style={{ marginLeft: 6 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Analytics TAB */}
      {activeTab === 'Analytics' && (
        <div>
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : analytics ? (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{analytics.total_resources || 0}</div>
                  <div className="stat-label"><FiBook style={{ marginRight: 4 }} /> Total Resources</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{analytics.total_users || 0}</div>
                  <div className="stat-label"><FiUsers style={{ marginRight: 4 }} /> Total Users</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{analytics.total_searches || 0}</div>
                  <div className="stat-label"><FiSearch style={{ marginRight: 4 }} /> Total Searches</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{analytics.total_ai_queries || 0}</div>
                  <div className="stat-label"><FiMessageCircle style={{ marginRight: 4 }} /> AI Questions</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Top Searches */}
                <div className="glass-card-static">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-accent)' }}>🔍 Top Searches</h3>
                  {(analytics.top_searches || []).length > 0 ? (
                    <ul style={{ listStyle: 'none' }}>
                      {analytics.top_searches.map((s, i) => (
                        <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                          <span style={{ color: 'var(--text-primary)' }}>{s.query}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{s.count} searches</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No search data yet</p>}
                </div>

                {/* Resources by Subject */}
                <div className="glass-card-static">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-accent)' }}>📚 Resources by Subject</h3>
                  {(analytics.resources_by_subject || []).length > 0 ? (
                    <ul style={{ listStyle: 'none' }}>
                      {analytics.resources_by_subject.map((s, i) => (
                        <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                          <span style={{ color: 'var(--text-primary)' }}>{s.subject}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{s.count} files</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No resources yet</p>}
                </div>
              </div>

              {/* Recent Questions */}
              {(analytics.recent_questions || []).length > 0 && (
                <div className="glass-card-static" style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-accent)' }}>❓ Recent Student Questions</h3>
                  <ul style={{ listStyle: 'none' }}>
                    {analytics.recent_questions.map((q, i) => (
                      <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-glass)', fontSize: 14, color: 'var(--text-primary)' }}>
                        "{q.question}"
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          {q.user_name} • {q.timestamp ? new Date(q.timestamp).toLocaleString() : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No analytics data yet</h3>
              <p>Upload resources and data will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* UPLOAD TAB */}
      {activeTab === 'upload' && (
        <div className="glass-card-static" style={{ maxWidth: 600 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: 'var(--text-bright)' }}>Upload Resource</h3>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label htmlFor="upload-title">Title</label>
              <input id="upload-title" type="text" className="form-input" placeholder="e.g., OS Scheduling Algorithms Notes"
                value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="upload-subject">Subject</label>
              <input id="upload-subject" type="text" className="form-input" placeholder="e.g., Operating Systems"
                value={uploadForm.subject} onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="upload-topic">Topic</label>
              <input id="upload-topic" type="text" className="form-input" placeholder="e.g., Process Scheduling"
                value={uploadForm.topic} onChange={(e) => setUploadForm({ ...uploadForm, topic: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="upload-desc">Description</label>
              <textarea id="upload-desc" className="form-textarea" placeholder="Brief description of the resource..."
                value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="upload-type">File Type</label>
              <select id="upload-type" className="form-select" value={uploadForm.file_type}
                onChange={(e) => setUploadForm({ ...uploadForm, file_type: e.target.value })}>
                <option value="pdf">PDF Notes</option>
                <option value="slides">Lecture Slides</option>
                <option value="code">Code File</option>
                <option value="lab_manual">Lab Manual</option>
                <option value="question_paper">Question Paper</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="upload-target-class">Target Class</label>
              <select id="upload-target-class" className="form-select" value={uploadForm.target_class}
                onChange={(e) => setUploadForm({ ...uploadForm, target_class: e.target.value })}>
                <option value="All">All Classes</option>
                <option value="FE">FE (First Year)</option>
                <option value="SE">SE (Second Year)</option>
                <option value="TE">TE (Third Year)</option>
                <option value="BE">BE (Final Year)</option>
              </select>
            </div>
            <div className="form-group">
              <label>File</label>
              <div className="upload-area" onClick={() => document.getElementById('file-input').click()}>
                <div className="upload-icon">📂</div>
                <p>{uploadForm.file ? uploadForm.file.name : 'Click to select a file'}</p>
                <p className="hint">PDF, code files, slides, etc.</p>
              </div>
              <input id="file-input" type="file" style={{ display: 'none' }}
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={uploading}>
              <FiUpload /> {uploading ? 'Uploading...' : 'Upload Resource'}
            </button>
          </form>
        </div>
      )}

      {/* TOPICS TAB */}
      {activeTab === 'topics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }}>
          {/* Create Topic */}
          <div className="glass-card-static">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: 'var(--text-bright)' }}>Create Topic</h3>
            <form onSubmit={handleCreateTopic}>
              <div className="form-group">
                <label htmlFor="topic-subject">Subject</label>
                <input id="topic-subject" type="text" className="form-input" placeholder="e.g., Data Structures"
                  value={topicForm.subject} onChange={(e) => setTopicForm({ ...topicForm, subject: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="topic-name">Topic Name</label>
                <input id="topic-name" type="text" className="form-input" placeholder="e.g., Linked Lists"
                  value={topicForm.topic_name} onChange={(e) => setTopicForm({ ...topicForm, topic_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="topic-keywords">Keywords (comma separated)</label>
                <input id="topic-keywords" type="text" className="form-input" placeholder="linked list, singly, doubly, circular"
                  value={topicForm.keywords} onChange={(e) => setTopicForm({ ...topicForm, keywords: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                <FiPlusCircle /> Create Topic
              </button>
            </form>
          </div>

          {/* Existing Topics */}
          <div className="glass-card-static">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-bright)' }}>Existing Topics ({topics.length})</h3>
            {topics.length > 0 ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {topics.map((t) => (
                  <div key={t.id} style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{t.topic_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>📚 {t.subject}</div>
                    {t.keywords?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                        {t.keywords.map((k, i) => (
                          <span key={i} style={{ padding: '2px 8px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 12, fontSize: 11, color: 'var(--violet-400)' }}>{k}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No topics created yet</p>
            )}
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && isAdmin && (
        <div className="glass-card-static">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--text-bright)' }}>Manage Users</h3>

          {/* Pill Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, borderBottom: '1px solid var(--border-glass)', paddingBottom: 16 }}>
            {[
              { id: 'Faculty', label: 'Faculty & Admins' },
              { id: 'FE', label: 'FE (First Year)' },
              { id: 'SE', label: 'SE (Second Year)' },
              { id: 'TE', label: 'TE (Third Year)' },
              { id: 'BE', label: 'BE (Final Year)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setUserTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: userTab === tab.id ? 'none' : '1px solid var(--border-glass)',
                  background: userTab === tab.id ? 'var(--gradient-primary)' : 'transparent',
                  color: userTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: userTab === tab.id ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'grid', gap: 12 }}>
            {usersList.filter(u => {
              if (userTab === 'Faculty') return u.role === 'faculty' || u.role === 'admin';
              return u.role === 'student' && u.class_name === userTab;
            }).map(u => (
              <div key={u.id} style={{ padding: '12px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                    {u.name} 
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>({u.email})</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
                    <span>Role: <strong style={{ color: u.role === 'admin' ? 'var(--cyan-500)' : u.role === 'faculty' ? 'var(--violet-500)' : 'var(--text-secondary)' }}>{u.role.toUpperCase()}</strong></span>
                    {u.role === 'student' && u.class_name && <span>Class: <strong>{u.class_name}</strong></span>}
                    {u.role === 'student' && u.roll_number && <span>Roll No: <strong>{u.roll_number}</strong></span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {u.role === 'student' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handlePromote(u.id)}>
                      Promote to Faculty
                    </button>
                  )}
                  {u.id !== user?.id && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemoveUser(u.id, u.name)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            {usersList.filter(u => {
              if (userTab === 'Faculty') return u.role === 'faculty' || u.role === 'admin';
              return u.role === 'student' && u.class_name === userTab;
            }).length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                No users found in this category.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { postAssist } from '../api';
import toast from 'react-hot-toast';
import { FiUpload, FiFileText, FiImage, FiLoader, FiCheckCircle } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from '../components/Mermaid';
import CodeViewer from '../components/CodeViewer';

export default function ConceptifyAssist() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a question paper (PDF or Image)');

    setLoading(true);
    setResults([]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await postAssist(formData);
      if (res.data.error) {
        toast.error(res.data.error);
      } else {
        setResults(res.data.results || []);
        toast.success(`Extracted and answered ${res.data.results?.length} questions!`);
      }
    } catch (err) {
      toast.error('Failed to process file. Ensure the backend is running with OCR support.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-fade-in">
      <div className="page-header">
        <h1>Conceptify Assist</h1>
        <p>Upload a question paper (PDF or Image) to automatically extract questions and get answers from the department knowledge hub.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: results.length > 0 ? '400px 1fr' : '1fr', gap: 32, alignItems: 'start' }}>
        {/* Upload Section */}
        <div className="glass-card-static">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text-bright)' }}>Upload Question Paper</h3>
          <form onSubmit={handleSubmit}>
            <div className="upload-area" onClick={() => document.getElementById('assist-file').click()} 
                 style={{ borderStyle: file ? 'solid' : 'dashed', borderColor: file ? 'var(--violet-500)' : 'var(--border-glass)' }}>
              <div className="upload-icon">
                {file ? (file.type.includes('pdf') ? <FiFileText /> : <FiImage />) : <FiUpload />}
              </div>
              <p style={{ fontWeight: 600, color: file ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {file ? file.name : 'Drop your paper here'}
              </p>
              <p className="hint">Supports PDF, PNG, JPG</p>
            </div>
            <input id="assist-file" type="file" style={{ display: 'none' }} accept=".pdf,image/*" onChange={handleFileChange} />
            
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || !file} style={{ marginTop: 24 }}>
              {loading ? <><FiLoader className="spinner" /> Analyzing...</> : 'Analyze Paper'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="glass-card-static">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiCheckCircle style={{ color: 'var(--green-400)' }} /> Analysis Results
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {results.map((item) => (
                <div key={item.number} style={{ padding: 20, background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <span style={{ 
                      background: 'var(--gradient-primary)', 
                      color: 'white', 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {item.number}
                    </span>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {item.question}
                    </h4>
                  </div>
                  <div className="markdown-body" style={{ padding: '12px 16px', borderLeft: '3px solid var(--violet-400)', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '0 8px 8px 0', color: 'var(--text-secondary)' }}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          if (!inline && match && match[1] === 'mermaid') {
                            return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                          }
                          const language = match ? match[1] : 'python';
                          return !inline ? (
                            <CodeViewer 
                              code={String(children).replace(/\n$/, '')} 
                              language={language}
                              customBg="rgba(15, 23, 42, 0.5)"
                            />
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {item.answer}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && results.length === 0 && (
          <div className="glass-card-static" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FiLoader className="spinner" style={{ fontSize: 40, color: 'var(--violet-500)', marginBottom: 20 }} />
            <h3>Processing Exam Paper...</h3>
            <p style={{ color: 'var(--text-muted)' }}>We are extracting questions and searching for matching answers in your department hub.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import CodeViewer from '../components/CodeViewer';
import { debugCode } from '../api';
import { FiPlay, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DebugHelper() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDebug = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await debugCode(code, language);
      setResult(res.data.analysis);
    } catch (err) {
      setResult({ errors: ['Failed to analyze code: ' + (err.response?.data?.detail || 'Unknown error')], corrected_code: code, explanation: '' });
    }
    setLoading(false);
  };

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
  ];

  const sampleCode = {
    python: `def fibonacci(n):\n    if n <= 0:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci("5"))`,
    c: `#include <stdio.h>\nint main() {\n    int arr[5] = {1, 2, 3, 4, 5};\n    for(int i = 0; i <= 5; i++) {\n        printf("%d ", arr[i]);\n    }\n    return 0;\n}`,
    cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int* ptr = new int[10];\n    for(int i = 0; i <= 10; i++)\n        ptr[i] = i;\n    cout << ptr[10];\n    return 0;\n}`,
    java: `public class Main {\n    public static void main(String[] args) {\n        String s = null;\n        System.out.println(s.length());\n    }\n}`,
  };

  return (
    <div>
      <div className="page-header">
        <h1>Error & Debug Helper</h1>
        <p>Paste your code to get AI-powered syntax analysis, error detection, and corrected code</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {languages.map((l) => (
            <button key={l.value} className={`tab ${language === l.value ? 'active' : ''}`}
              onClick={() => setLanguage(l.value)}>
              {l.label}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setCode(sampleCode[language] || '')}>
          Load Sample
        </button>
        <button className="btn btn-primary" onClick={handleDebug} disabled={loading || !code.trim()}>
          <FiPlay /> {loading ? 'Analyzing...' : 'Analyze Code'}
        </button>
      </div>

      <div className="code-editor-container">
        {/* Input Panel */}
        <div className="code-panel">
          <div className="code-panel-header">
            <span>📝 Your Code</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{language.toUpperCase()}</span>
          </div>
          <textarea
            id="code-input"
            className="code-textarea"
            placeholder={`Paste your ${language} code here...`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Output Panel */}
        <div className="code-panel">
          <div className="code-panel-header">
            <span>✅ Corrected Code</span>
          </div>
          {result?.corrected_code ? (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <CodeViewer code={result.corrected_code} language={language} />
            </div>
          ) : (
            <div className="code-textarea" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              {loading ? (
                <div className="loading-dots"><span /><span /><span /></div>
              ) : (
                'Corrected code will appear here'
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {result && (
        <div style={{ marginTop: 24 }}>
          {/* Errors */}
          <div className="analysis-section">
            <h3>
              <FiAlertTriangle style={{ color: 'var(--red-400)' }} />
              Errors Found
            </h3>
            <ul className="error-list markdown-body">
              {(result.errors || []).map((err, i) => (
                <li key={i}><ReactMarkdown remarkPlugins={[remarkGfm]}>{err}</ReactMarkdown></li>
              ))}
            </ul>
          </div>

          {/* Explanation */}
          {result.explanation && (
            <div className="analysis-section">
              <h3>
                <FiInfo style={{ color: 'var(--cyan-400)' }} />
                Explanation
              </h3>
              <div className="explanation-block markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.explanation}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

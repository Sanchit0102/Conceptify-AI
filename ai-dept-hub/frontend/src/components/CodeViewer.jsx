import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nightOwl } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeViewer({ code, language = 'python' }) {
  if (!code) return null;
  return (
    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <SyntaxHighlighter
        language={language}
        style={nightOwl}
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '14px',
          lineHeight: '1.6',
          background: 'rgba(10, 10, 30, 0.9)',
          borderRadius: 'var(--radius-md)',
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

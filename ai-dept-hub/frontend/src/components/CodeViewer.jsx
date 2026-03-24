import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeViewer({ code, language = 'python', customBg, highlightFixes = false }) {
  if (!code) return null;

  // If highlighting fixes, we need to process the code to find line numbers
  const lines = code.split('\n');
  const fixLines = [];
  const cleanCode = lines.map((line, index) => {
    if (highlightFixes && (line.includes('// @FIX') || line.includes('# @FIX'))) {
      fixLines.push(index + 1);
      return line.replace('// @FIX', '').replace('# @FIX', '').trimEnd();
    }
    return line;
  }).join('\n');

  return (
    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: '16px',
          fontSize: '14px',
          lineHeight: '1.6',
          background: customBg || '#1e1e2e',
          borderRadius: 'var(--radius-md)',
        }}
        showLineNumbers
        wrapLines={true}
        lineProps={(lineNumber) => {
          const style = { display: 'block', width: '100%' };
          if (fixLines.includes(lineNumber)) {
            style.backgroundColor = 'rgba(16, 185, 129, 0.25)';
            style.borderLeft = '6px solid #10b981';
            style.boxShadow = 'inset 0 0 15px rgba(16, 185, 129, 0.2)';
            style.fontWeight = 'bold';
          }
          return { style };
        }}
      >
        {cleanCode}
      </SyntaxHighlighter>
    </div>
  );
}

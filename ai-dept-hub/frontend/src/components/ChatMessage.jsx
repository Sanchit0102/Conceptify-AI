import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from './Mermaid';

export default function ChatMessage({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="avatar">
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="bubble">
        {isUser ? content : (
          <div className="markdown-body" style={{ color: 'inherit' }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (!inline && match && match[1] === 'mermaid') {
                    return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                  }
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

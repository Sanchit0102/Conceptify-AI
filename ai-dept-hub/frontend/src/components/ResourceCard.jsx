import { getFileUrl } from '../api';
import { FiDownload, FiFile } from 'react-icons/fi';

const badgeClass = (fileType) => {
  switch (fileType) {
    case 'pdf': return 'badge-pdf';
    case 'code': return 'badge-code';
    case 'slides': return 'badge-slides';
    case 'lab_manual': return 'badge-lab';
    default: return 'badge-default';
  }
};

const badgeLabel = (fileType) => {
  switch (fileType) {
    case 'pdf': return 'PDF';
    case 'code': return 'Code';
    case 'slides': return 'Slides';
    case 'lab_manual': return 'Lab Manual';
    case 'question_paper': return 'Question Paper';
    default: return 'Resource';
  }
};

export default function ResourceCard({ resource, onClick }) {
  return (
    <div className="resource-card" onClick={() => onClick?.(resource)} role="button" tabIndex={0}>
      <div className="card-header">
        <span className="card-title">{resource.title}</span>
        <span className={`card-badge ${badgeClass(resource.file_type)}`}>
          {badgeLabel(resource.file_type)}
        </span>
      </div>
      <div className="card-meta">
        <span className="card-meta-item">📚 {resource.subject}</span>
        {resource.topic && <span className="card-meta-item">📌 {resource.topic}</span>}
      </div>
      {resource.description && (
        <p className="card-desc">{resource.description}</p>
      )}
      {resource.ai_summary && (
        <p className="card-desc" style={{ marginTop: 8, color: 'var(--text-accent)', fontSize: 12 }}>
          ✨ AI Summary: {resource.ai_summary.slice(0, 150)}...
        </p>
      )}
      {resource.file_path && (
        <a
          href={getFileUrl(resource.file_path)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 12, display: 'inline-flex' }}
          onClick={(e) => e.stopPropagation()}
        >
          <FiDownload /> Download
        </a>
      )}
    </div>
  );
}

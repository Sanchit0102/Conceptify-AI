import { FiSearch, FiX } from 'react-icons/fi';
import { useState } from 'react';

export default function SearchBar({ onSearch, placeholder = 'Search notes, labs, concepts...' }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch(''); // Trigger empty search to clear results if needed
  };

  return (
    <form className="search-container" onSubmit={handleSubmit} style={{ position: 'relative' }}>
      <input
        id="global-search"
        type="text"
        className="search-input"
        style={{ paddingLeft: '20px' }} // Remove large left offset since icon is moving
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button 
        type={query ? "button" : "submit"}
        className="search-clear" 
        onClick={query ? handleClear : undefined}
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          color: query ? 'var(--red-400)' : 'var(--text-muted)',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label={query ? "Clear search" : "Search"}
      >
        {query ? <FiX /> : <FiSearch />}
      </button>
    </form>
  );
}

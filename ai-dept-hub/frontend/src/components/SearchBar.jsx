import { FiSearch } from 'react-icons/fi';
import { useState } from 'react';

export default function SearchBar({ onSearch, placeholder = 'Search notes, labs, concepts...' }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form className="search-container" onSubmit={handleSubmit}>
      <FiSearch className="search-icon" />
      <input
        id="global-search"
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}

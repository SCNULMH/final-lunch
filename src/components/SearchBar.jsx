// src/components/SearchBar.jsx
import React from 'react';

export default function SearchBar({
  address, setAddress,
  results = [], onSearch, onSelect, loading
}) {
  return (
    <>
      <div className="search-row">
        <input
          type="text"
          placeholder="주소 또는 건물명 입력"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
          disabled={loading}
        />
        <button onClick={onSearch} disabled={loading}>
          {loading ? '검색중...' : '검색'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="scrollable-list">
          {results.map((r, i) => (
            <div key={i} className="search-result-item" onClick={() => onSelect(r)}>
              {r.address_name || r.place_name}
              {r.place_name && r.address_name ? ` (${r.place_name})` : ''}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

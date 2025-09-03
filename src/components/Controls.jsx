// src/components/Controls.jsx
import React from 'react';
import RadiusInput from '../RadiusInput';

export default function Controls({
  isLoading, onLocation, radius, setRadius,
  count, setCount, included, setIncluded, excluded, setExcluded,
  onRandom
}) {
  return (
    <>
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <button className="location-btn" onClick={onLocation} disabled={isLoading}>
          {isLoading ? '위치 찾는중...' : '내 위치로'}
        </button>
      </div>

      <RadiusInput setRadius={setRadius} />

      <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:16,margin:'16px 0',flexWrap:'wrap'}}>
        <input
          type="number"
          className="recommend-count"
          placeholder="추천 개수"
          value={count || ''}
          onChange={(e) => setCount(Number(e.target.value) || 0)}
          min="1" max="15" style={{ width: 120 }}
        />
        <button className={`rand-btn ${isLoading ? 'loading' : ''}`} onClick={onRandom} disabled={isLoading}>
          {isLoading ? '추천중...' : '랜덤 추천'}
        </button>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',gap:12,margin:'16px 0',flexWrap:'wrap'}}>
        <input
          type="text" placeholder="추천할 카테고리 (예: 한식)"
          value={included} onChange={(e) => setIncluded(e.target.value || '')}
          style={{ flex: 1, minWidth: 200 }}
        />
        <input
          type="text" placeholder="제외할 카테고리 (쉼표로 구분)"
          value={excluded} onChange={(e) => setExcluded(e.target.value || '')}
          style={{ flex: 1, minWidth: 200 }}
        />
      </div>
    </>
  );
}

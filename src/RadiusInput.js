// src/RadiusInput.js
import React, { useState } from 'react';

const RadiusInput = ({ setRadius }) => {
  const [value, setValue] = useState(2000); // 기본값 2000m

  const commit = (v) => {
    const n = Number(v) || 0;
    setValue(n);
    setRadius(n);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(value); }}
          placeholder="반경(m)"
          style={{ width: 120, textAlign: 'right' }}
        />
        <button onClick={() => commit(value)}>설정</button>
      </div>

      {/* 프리셋: 300 / 500 / 1000 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {[300, 500, 1000].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => commit(p)}
            style={{ padding: '6px 10px', borderRadius: 12 }}
            title={`${p}m`}
          >
            {p}m
          </button>
        ))}
      </div>
    </div>
  );
};

export default RadiusInput;

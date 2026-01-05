// Controls.jsx (controls2 버전 기준)
import React, { useMemo, useState } from 'react';
import RadiusInput from '../RadiusInput';

function parseList(csv) {
  return (csv || '').split(',').map(s => s.trim()).filter(Boolean);
}
function toCsv(list) {
  return (list || []).join(',');
}

function ExcludePicker({ excluded, setExcluded }) {
  const [open, setOpen] = useState(false);

  const PRESETS = useMemo(
    () => ['회', '술집', '치킨', '피자', '패스트푸드', '카페', '고기', '중식'],
    []
  );

  const selected = useMemo(() => parseList(excluded), [excluded]);

  const toggle = (label) => {
    const on = selected.includes(label);
    const next = on ? selected.filter(x => x !== label) : [...selected, label];
    setExcluded(toCsv(next));
  };

  const removeOne = (label) => setExcluded(toCsv(selected.filter(x => x !== label)));
  const clearAll = () => setExcluded('');

  return (
    <div className="exclude-box">
      <div className="exclude-head">
        <div className="exclude-title">🚫 오늘은 이건 싫어요</div>
        <button type="button" className="link-btn" onClick={() => setOpen(v => !v)}>
          {open ? '닫기' : '카테고리 고르기'}
        </button>
      </div>

      {selected.length > 0 ? (
        <div className="chip-row compact">
          {selected.map((label) => (
            <button
              key={label}
              type="button"
              className="chip chip--off"
              onClick={() => removeOne(label)}
              title="눌러서 제거"
            >
              {label} ✕
            </button>
          ))}
        </div>
      ) : (
        <div className="exclude-empty">선택 안 하면 모든 음식에서 골라줘요</div>
      )}

      {open && (
        <div className="exclude-panel">
          <div className="chip-row">
            {PRESETS.map((label) => {
              const on = selected.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  className={`chip ${on ? 'chip--off' : ''}`}
                  onClick={() => toggle(label)}
                  aria-pressed={on}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="exclude-actions">
            <button type="button" className="mini-btn ghost" onClick={clearAll} disabled={selected.length === 0}>
              전체 해제
            </button>
          </div>

          <details className="advanced">
            <summary>직접 입력(고급)</summary>
            <input
              type="text"
              placeholder="예: 회, 술집"
              value={excluded}
              onChange={(e) => setExcluded(e.target.value || '')}
            />
            <div className="hint">쉼표(,)로 구분</div>
          </details>
        </div>
      )}
    </div>
  );
}

export default function Controls({
  isLoading, onLocation,
  radius, setRadius,
  count, setCount,
  included, setIncluded,
  excluded, setExcluded,
  onRandom
}) {
  const [optOpen, setOptOpen] = useState(false);

  const closeOpt = () => setOptOpen(false);
  const openOpt = () => setOptOpen(true);

  return (
    <div className="controls2">
      {/* 메인 CTA */}
      <button
        className={`primary-cta2 ${isLoading ? 'loading' : ''}`}
        onClick={onRandom}
        disabled={isLoading}
      >
        {isLoading ? '고르는 중…' : '🍽️ 이거 빼고 골라줘'}
      </button>

      <button className="location-btn" onClick={onLocation} disabled={isLoading}>
        {isLoading ? '위치 찾는중...' : '내 위치로'}
      </button>
    
      {/* 제외 */}
      <ExcludePicker excluded={excluded} setExcluded={setExcluded} />

      {/* 옵션: 토스 느낌 바텀시트로 */}
      <button type="button" className="option-pill" onClick={openOpt}>
        ⚙️ 옵션 열기
      </button>

      {/* ===== 바텀시트 ===== */}
      {optOpen && (
        <div className="sheet-backdrop" onClick={closeOpt}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-head">
              <div className="sheet-title">옵션</div>
              <button type="button" className="sheet-close" onClick={closeOpt}>닫기</button>
            </div>

            <div className="sheet-body">
              

              <div className="sheet-section">
                <div className="field-row">
                  <div className="field-label">추천 개수</div>
                  <input
                    type="number"
                    className="recommend-count"
                    value={count || ''}
                    onChange={(e) => setCount(Number(e.target.value) || 0)}
                    min="1"
                    max="15"
                  />
                </div>
              </div>

              <div className="sheet-section">
                <div className="field-label">반경</div>
                <RadiusInput setRadius={setRadius} />
                <div className="hint">현재: {radius}m</div>
              </div>

              <div className="sheet-section">
                <div className="field-label">포함 카테고리(선택)</div>
                <input
                  type="text"
                  placeholder="예: 한식"
                  value={included}
                  onChange={(e) => setIncluded(e.target.value || '')}
                />
              </div>
            </div>

            <div className="sheet-footer">
              <button type="button" className="sheet-done" onClick={closeOpt}>
                적용 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// src/BookmarkList.js
import React from 'react';

function BookmarkList({
  bookmarks = {},         // { [id]: bookmarkData }
  onSelect = () => {},    // 카드 클릭 시 선택 콜백
  toggleBookmark = () => {} // 북마크 토글 콜백 (id, item)
}) {
  const list = Object.values(bookmarks || {});
  // 정렬(선택): 이름 기준 오름차순
  list.sort((a, b) => (a.place_name || '').localeCompare(b.place_name || '', 'ko'));

  if (list.length === 0) {
    return (
      <div id="restaurantList">
        <div style={{ textAlign: 'center', color: '#888', padding: 24 }}>
          북마크한 식당이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div id="restaurantList">
      {list.map((item) => {
        const bookmarkId = String(item.id ?? '');
        return (
          <div
            className="restaurant-card"
            key={bookmarkId || `${item.x}_${item.y}_${item.place_name}`}
            onClick={() => onSelect(item)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(item);
            }}
          >
            {/* 북마크 토글 버튼 (북마크 리스트에서는 항상 on 상태) */}
            <button
              className="bookmark-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(bookmarkId || item.id, item); // 해제 동작
              }}
              aria-label="북마크 해제"
              title="북마크 해제"
              style={{
                background: '#FFD600',
                color: '#222',
                fontSize: '1.4em',
                width: 40,
                height: 40,
                border: 'none',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
                transition: 'background 0.2s',
                alignSelf: 'flex-end',
              }}
            >
              <span style={{ fontSize: '0.9em', lineHeight: 1, fontWeight: 'bold' }}>★</span>
            </button>

            {/* 본문 */}
            <div className="restaurant-title">{item.place_name}</div>
            <div className="restaurant-meta">
              {item.road_address_name || item.address_name}
            </div>
            {item.category_name && (
              <div className="restaurant-meta">{item.category_name}</div>
            )}
            {item.phone && (
              <div className="restaurant-meta">전화: {item.phone}</div>
            )}
            {item.distance && (
              <div className="restaurant-meta">거리: {item.distance}m</div>
            )}

            {/* 상세보기 */}
            {item.place_url && (
              <button
                className="detail-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.place_url, '_blank');
                }}
              >
                상세보기
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default BookmarkList;

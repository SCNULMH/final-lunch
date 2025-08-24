import React from 'react';

function RestaurantList({
  restaurants = [],
  onSelect = () => {},
  bookmarks = {},
  toggleBookmark = () => {},
}) {
  if (!Array.isArray(restaurants)) restaurants = [];

  return (
    <div id="restaurantList">
      {restaurants.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', padding: '24px' }}>
          검색 결과가 없습니다.
        </div>
      ) : (
        restaurants.map((item) => {
          // ID를 문자열로 통일
          const bookmarkId = String(item.id ?? '');
          const isBookmarked = !!bookmarks[bookmarkId];

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
              {/* 북마크 토글 버튼 */}
              <button
                className="bookmark-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(bookmarkId || item.id, item);
                }}
                aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
                title={isBookmarked ? '북마크 해제' : '북마크 추가'}
                style={{
                  background: isBookmarked ? '#FFD600' : 'transparent',
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
                <span
                  style={{
                    fontSize: '0.9em',
                    lineHeight: 1,
                    fontWeight: 'bold',
                  }}
                >
                  ★
                </span>
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
        })
      )}
    </div>
  );
}

export default RestaurantList;

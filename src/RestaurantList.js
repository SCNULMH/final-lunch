// src/RestaurantList.js

import React, { useState, useEffect } from 'react';

// 북마크 상태를 localStorage에서 불러오고 저장하는 함수
const loadBookmarks = () => {
  try {
    return JSON.parse(localStorage.getItem('bookmarks') || '{}');
  } catch {
    return {};
  }
};
const saveBookmarks = (bookmarks) => {
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
};

function RestaurantList({ restaurants, onSelect }) {
  const [bookmarks, setBookmarks] = useState({});

  // 컴포넌트가 처음 렌더링될 때 북마크 로드
  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  // 북마크 토글 함수
  const toggleBookmark = (id, item) => {
    setBookmarks((prev) => {
      const updated = { ...prev };
      if (updated[id]) {
        delete updated[id];
      } else {
        updated[id] = item;
      }
      saveBookmarks(updated);
      return updated;
    });
  };

  return (
    <div id="restaurantList">
      {restaurants.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', padding: '24px' }}>
          검색 결과가 없습니다.
        </div>
      ) : (
        restaurants.map((item) => {
          const isBookmarked = !!bookmarks[item.id];
          return (
            <div
              className="restaurant-card"
              key={item.id}
              onClick={() => onSelect(item)}
              tabIndex={0}
              role="button"
            >
              {/* 북마크 버튼 */}
              <button
                className="bookmark-btn"
                onClick={e => {
                  e.stopPropagation();
                  toggleBookmark(item.id, item);
                }}
                aria-label={isBookmarked ? "북마크 해제" : "북마크 추가"}
                style={{
                  background: isBookmarked ? '#FFD600' : 'transparent',
                  color: '#222',
                  fontSize: '1.7em',
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '8px',
                  transition: 'background 0.2s'
                }}
              >
                <span style={{
                  fontSize: '0.8em',
                  lineHeight: 1,
                  fontWeight: 'bold'
                }}>
                  ★
                </span>
              </button>
              <div className="restaurant-title">{item.place_name}</div>
              <div className="restaurant-meta">
                {item.road_address_name || item.address_name}
              </div>
              <div className="restaurant-meta">
                {item.category_name}
              </div>
              {item.phone && (
                <div className="restaurant-meta">
                  전화: {item.phone}
                </div>
              )}
              {item.distance && (
                <div className="restaurant-meta">
                  거리: {item.distance}m
                </div>
              )}
              <button
                className="detail-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.place_url, '_blank');
                }}
              >
                상세보기
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default RestaurantList;

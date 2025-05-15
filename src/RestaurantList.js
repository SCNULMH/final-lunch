import React, { useState, useEffect } from 'react';
import { addBookmark, removeBookmark, subscribeBookmarks } from './services/bookmark';
import { auth } from './firebase';

function RestaurantList({ restaurants, onSelect }) {
  const [bookmarks, setBookmarks] = useState({});

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (!user) {
        setBookmarks({});
        return;
      }

      const unsubscribeBookmark = subscribeBookmarks(user.uid, (data) => {
        setBookmarks({ ...data }); // 새로운 객체로 상태 업데이트
      });

      return unsubscribeBookmark;
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const toggleBookmark = async (id, item) => {
    const user = auth.currentUser;
    if (!user) return;

    const bookmarkId = String(id); // ID 문자열 변환
    console.log("Firestore 문서 ID:", bookmarkId);
    console.log("React 상태의 북마크 ID:", Object.keys(bookmarks));

    try {
      if (bookmarks[bookmarkId]) {
        await removeBookmark(user.uid, bookmarkId);
      } else {
        await addBookmark(user.uid, { ...item, id: bookmarkId });
      }
    } catch (error) {
      console.error("북마크 토글 실패:", error);
    }
  };

  return (
    <div id="restaurantList">
      {restaurants.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', padding: '24px' }}>
          검색 결과가 없습니다.
        </div>
      ) : (
        restaurants.map((item) => {
          const bookmarkId = String(item.id); // ID 문자열 변환
          const isBookmarked = !!bookmarks[bookmarkId];

          return (
            <div
              className="restaurant-card"
              key={item.id}
              onClick={() => onSelect(item)}
              tabIndex={0}
              role="button"
            >
              <button
                className="bookmark-btn"
                onClick={(e) => {
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
                  transition: 'background 0.2s',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8em',
                    lineHeight: 1,
                    fontWeight: 'bold',
                  }}
                >
                  ★
                </span>
              </button>
              <div className="restaurant-title">{item.place_name}</div>
              <div className="restaurant-meta">
                {item.road_address_name || item.address_name}
              </div>
              <div className="restaurant-meta">{item.category_name}</div>
              {item.phone && (
                <div className="restaurant-meta">전화: {item.phone}</div>
              )}
              {item.distance && (
                <div className="restaurant-meta">거리: {item.distance}m</div>
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
  
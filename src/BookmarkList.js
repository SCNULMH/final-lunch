// src/BookmarkList.js

import React, { useState, useEffect } from 'react';

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

function BookmarkList() {
  const [bookmarks, setBookmarks] = useState({});
  const [recommend, setRecommend] = useState(null);

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  // 좋아요/싫어요 토글
  const toggleLike = (id) => {
    setBookmarks(prev => {
      const updated = { ...prev };
      if (!updated[id]) return prev;
      updated[id].like = updated[id].like === true ? undefined : true;
      updated[id].dislike = undefined;
      saveBookmarks(updated);
      return { ...updated };
    });
  };
  const toggleDislike = (id) => {
    setBookmarks(prev => {
      const updated = { ...prev };
      if (!updated[id]) return prev;
      updated[id].dislike = updated[id].dislike === true ? undefined : true;
      updated[id].like = undefined;
      saveBookmarks(updated);
      return { ...updated };
    });
  };

  // 랜덤 추천
  const recommendRandom = (type = 'all') => {
    const arr = Object.values(bookmarks).filter(item => {
      if (type === 'like') return item.like;
      if (type === 'notDislike') return !item.dislike;
      return true;
    });
    if (arr.length === 0) {
      setRecommend(null);
      return;
    }
    const randomItem = arr[Math.floor(Math.random() * arr.length)];
    setRecommend(randomItem);
  };

  return (
    <div className="bookmark-container">
      <h2>북마크한 식당</h2>
      <div style={{ margin: "10px 0" }}>
        <button onClick={() => recommendRandom('all')}>전체에서 돌리기</button>
        <button onClick={() => recommendRandom('like')}>좋아요만 돌리기</button>
        <button onClick={() => recommendRandom('notDislike')}>싫어요 제외하고 돌리기</button>
      </div>
      {recommend && (
        <div className="recommend-card">
          <b>추천!</b>
          <div>{recommend.place_name}</div>
          <div>{recommend.road_address_name || recommend.address_name}</div>
          <div>{recommend.category_name}</div>
        </div>
      )}
      <div>
        {Object.values(bookmarks).length === 0 ? (
          <div style={{ color: "#888", padding: "24px" }}>북마크한 식당이 없습니다.</div>
        ) : (
          Object.values(bookmarks).map(item => (
            <div className="restaurant-card" key={item.id}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  className="like-btn"
                  style={{ color: item.like ? "#E53935" : "#bbb", cursor: "pointer" }}
                  onClick={() => toggleLike(item.id)}
                  title="좋아요"
                  role="button"
                  tabIndex={0}
                >♥</span>
                <span
                  className="dislike-btn"
                  style={{ color: item.dislike ? "#1976D2" : "#bbb", cursor: "pointer" }}
                  onClick={() => toggleDislike(item.id)}
                  title="싫어요"
                  role="button"
                  tabIndex={0}
                >✖</span>
                <span style={{ fontWeight: "bold", fontSize: "1.08em" }}>{item.place_name}</span>
              </div>
              <div className="restaurant-meta">{item.road_address_name || item.address_name}</div>
              <div className="restaurant-meta">{item.category_name}</div>
              {item.phone && <div className="restaurant-meta">전화: {item.phone}</div>}
              <button
                className="detail-btn"
                onClick={() => window.open(item.place_url, "_blank")}
              >상세보기</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BookmarkList;

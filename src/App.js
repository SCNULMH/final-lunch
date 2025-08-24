// src/App.js

import React, { useState, useEffect, useRef } from 'react';
import MapComponent from './MapComponent';
import RestaurantList from './RestaurantList';
import RadiusInput from './RadiusInput';
import AuthModal from './components/AuthModal';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeBookmarks, addBookmark, removeBookmark } from './services/bookmark';
import './styles.css';

const REST_API_KEY = process.env.REACT_APP_KAKAO_REST_KEY || '';
const JAVASCRIPT_API_KEY = process.env.REACT_APP_KAKAO_JS_KEY || '';
const KAKAO_HEADERS = { Authorization: `KakaoAK ${REST_API_KEY}` };

/** 포함/제외 스코프 안에서 '한 페이지'를 가져오는 헬퍼
 * - include가 있으면 키워드 검색(query='한식 식당' 같은 느낌)
 * - include가 없으면 카테고리 검색(FD6=음식점)
 * - Kakao 제약: size<=15, page<=45
 */
async function fetchPlacesPage({ x, y, radius, include = '', page = 1, size = 15 }) {
  // 포함 필터가 있으면 "한식 식당" 같은 쿼리, 없으면 그냥 "식당"
  const q = (include && include.trim())
    ? `${include.trim()} 식당`
    : '식당';

  const url =
    `https://dapi.kakao.com/v2/local/search/keyword.json` +
    `?query=${encodeURIComponent(q)}` +
    `&x=${x}&y=${y}&radius=${radius}&page=${page}&size=${size}`;

  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } });
  if (!res.ok) throw new Error('카카오 검색 실패');
  return res.json();
}

const App = () => {
  // 인증
  const [user, setUser] = useState(null);

  // 지도/검색 기준(Anchor) — 주소 선택/현위치에서만 갱신, 랜덤 추천 중엔 유지
  const [searchCenter, setSearchCenter] = useState({ lat: 34.9687735, lng: 127.4802359 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [myPosition, setMyPosition] = useState(null);
  const [radius, setRadius] = useState(2000);

  const [address, setAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 리스트/랜덤/필터
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [includedCategory, setIncludedCategory] = useState('');
  const [excludedCategory, setExcludedCategory] = useState('');
  const [count, setCount] = useState(0);
  const [noIncludedMessage, setNoIncludedMessage] = useState('');

  // 북마크
  const [bookmarks, setBookmarks] = useState({});
  const [isBookmarkMode, setIsBookmarkMode] = useState(false);
  const [bookmarkRandomSelection, setBookmarkRandomSelection] = useState(null);

  // 모달
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // 세션 중복 회피용 메모리 (새로고침하면 초기화)
  const seenIdsRef = useRef(new Set());
  const bookmarkUnsubRef = useRef(null);

  /* === 1) 로그인/북마크 구독 === */
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // 기존 북마크 구독 해제
      if (bookmarkUnsubRef.current) {
        bookmarkUnsubRef.current();
        bookmarkUnsubRef.current = null;
      }

      if (currentUser) {
        bookmarkUnsubRef.current = subscribeBookmarks(currentUser.uid, (data) => {
          setBookmarks({ ...data });
        });
      } else {
        setBookmarks({});
      }
    });

    return () => {
      if (bookmarkUnsubRef.current) bookmarkUnsubRef.current();
      unsubscribeAuth();
    };
  }, []);

  /* === 2) 카카오맵 스크립트 로드 === */
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JAVASCRIPT_API_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => setMapLoaded(true));
    };
    document.head.appendChild(script);
  }, []);

  /* === 3) 주소/키워드 검색 === */
  const fetchAddressData = async (query) => {
    const addressUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
    const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;

    try {
      const [addressResponse, keywordResponse] = await Promise.all([
        fetch(addressUrl, { headers: KAKAO_HEADERS }),
        fetch(keywordUrl, { headers: KAKAO_HEADERS }),
      ]);

      if (!addressResponse.ok || !keywordResponse.ok) throw new Error('검색 실패');

      const addressData = await addressResponse.json();
      const keywordData = await keywordResponse.json();

      const combinedResults = [
        ...(addressData.documents || []),
        ...(keywordData.documents || []),
      ];

      if (combinedResults.length === 0) {
        const fallbackUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
        const fallbackRes = await fetch(fallbackUrl, { headers: KAKAO_HEADERS });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setSearchResults(fallbackData.documents || []);
        } else {
          alert('검색 결과가 없습니다.');
        }
      } else {
        setSearchResults(combinedResults);
      }
    } catch (e) {
      console.error(e);
      alert('검색 중 오류가 발생했습니다.');
    }
  };

  const handleSearch = async () => {
    if (!address) {
      alert('주소를 입력해 주세요.');
      return;
    }
    await fetchAddressData(address);
  };

  const handleSelectAddress = (result) => {
    const center = { lat: parseFloat(result.y), lng: parseFloat(result.x) };
    setAddress(result.address_name);
    setSearchCenter(center);                   // ★ 기준(Anchor) 갱신
    fetchNearbyRestaurants(center.lng, center.lat);
    setSearchResults([]);
    // 새로운 지역으로 이동했으니 세션 중복 기록 초기화
    seenIdsRef.current = new Set();
  };

  /* === 4) 반경 내 식당 조회(초기 표시용) === */
  const fetchNearbyRestaurants = async (x, y) => {
    let all = [];
    for (let page = 1; page <= 3; page++) {
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
        '식당'
      )}&x=${x}&y=${y}&radius=${radius}&page=${page}`;
      try {
        const res = await fetch(url, { headers: KAKAO_HEADERS });
        if (!res.ok) break;
        const data = await res.json();
        if (data.documents && data.documents.length > 0) {
          all = [...all, ...data.documents];
          if (data.documents.length < 15) break; // 다음 페이지 없음
        } else {
          break;
        }
      } catch (err) {
        console.error('페이지 요청 실패:', err);
        break;
      }
    }
    if (all.length > 0) {
      setRestaurants(all); // 초기 화면에는 전체 보여줌
    } else {
      alert('근처에 식당이 없습니다.');
    }
  };

  /* === 5) 랜덤 추천 (필터 스코프에서 '새로 검색' 방식, Anchor 고정) === */
  const handleSpin = async () => {
    const pickCount = count || 5;

    // 북마크 모드: 네트워크 X, 북마크 풀에서만
    if (isBookmarkMode) {
      const base = Object.values(bookmarks || {});
      if (base.length === 0) {
        alert('북마크한 식당이 없습니다.');
        return;
      }

      const exList = (excludedCategory || '').split(',').map(s => s.trim()).filter(Boolean);
      const inc = (includedCategory || '').trim();

      let pool = base.filter((r) => {
        const ex = exList.length ? exList.some(c => (r.category_name || '').includes(c)) : false;
        const okInc = inc ? (r.category_name || '').includes(inc) : true;
        return !ex && okInc;
      });

      if (pool.length === 0) {
        setNoIncludedMessage(inc ? `"${inc}" 카테고리가 북마크에 없어 랜덤으로 안내합니다.` : '');
        pool = base.filter((r) => exList.some(c => (r.category_name || '').includes(c)) ? false : true);
      } else {
        setNoIncludedMessage('');
      }

      const selection = [...pool].sort(() => 0.5 - Math.random()).slice(0, pickCount);
      setBookmarkRandomSelection(selection);
      return;
    }

    // 일반 모드: 필터 스코프에서 매번 새로 검색 (Anchor=searchCenter)
    const x = searchCenter.lng; // Kakao: x=lng, y=lat
    const y = searchCenter.lat;
    const inc = (includedCategory || '').trim();
    const exList = (excludedCategory || '').split(',').map(s => s.trim()).filter(Boolean);

    // 1) 1페이지로 전체 가용량 파악
    let first;
    try {
      first = await fetchPlacesPage({ x, y, radius, include: inc, page: 1, size: 15 });
    } catch (e) {
      console.error(e);
      alert('검색 중 오류가 발생했어요.');
      return;
    }

    const total = Math.min(first?.meta?.pageable_count || 0, 675); // Kakao: 최대 45p*15
    if (total === 0) {
      setNoIncludedMessage(inc ? `"${inc}" 음식점이 주변에 없어 랜덤 음식점을 안내합니다.` : '');
    } else {
      setNoIncludedMessage('');
    }
    const totalPages = Math.max(1, Math.min(45, Math.ceil(total / 15)));

    // 2) 임의 페이지를 여러 번 시도하며 새 아이템 수집
    const want = pickCount;
    const bucket = [];
    const usedPages = new Set();
    const notSeen = (r) => !seenIdsRef.current.has(String(r.id));
    const passExclude = (r) =>
      exList.length ? !exList.some(c => (r.category_name || '').includes(c)) : true;

    // 첫 페이지 결과 활용
    const primeDocs = (first?.documents || []).filter(passExclude).filter(notSeen);
    bucket.push(...primeDocs);

    // 부족하면 랜덤 페이지 더 긁기 (최대 8회)
    for (let tries = 0; bucket.length < want && tries < 8; tries++) {
      let p;
      for (let guard = 0; guard < 5; guard++) {
        const cand = 1 + Math.floor(Math.random() * totalPages);
        if (!usedPages.has(cand)) { p = cand; break; }
      }
      if (!p) p = 1 + Math.floor(Math.random() * totalPages);
      usedPages.add(p);

      try {
        const data = p === 1 ? first : await fetchPlacesPage({ x, y, radius, include: inc, page: p, size: 15 });
        const docs = (data?.documents || []).filter(passExclude).filter(notSeen);
        const existing = new Set(bucket.map(d => String(d.id)));
        docs.forEach(d => { if (!existing.has(String(d.id))) bucket.push(d); });
      } catch (e) {
        console.warn('페이지 로드 실패', e);
      }
    }

    // 3) 그래도 부족하면 seen 제외 완화해서 채우기
    if (bucket.length < want) {
      const more = (first?.documents || []).filter(passExclude); // seen 무시
      const existing = new Set(bucket.map(d => String(d.id)));
      more.forEach(d => { if (!existing.has(String(d.id))) bucket.push(d); });
    }

    if (bucket.length === 0) {
      alert('조건에 맞는 결과가 거의 없어요. 반경이나 필터를 조금 완화해보세요.');
      return;
    }

    // 4) 최종 랜덤 샘플
    const shuffled = [...bucket].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, want);

    // 5) 화면 반영 + seen 갱신 (지도/Anchor는 그대로 유지)
    setRestaurants(selection);
    selection.forEach(r => seenIdsRef.current.add(String(r.id)));
    if (seenIdsRef.current.size > 300) {
      seenIdsRef.current = new Set([...seenIdsRef.current].slice(-200));
    }
  };

  /* === 6) 현위치 기반 검색 === */
  const handleLocationClick = async () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 Geolocation을 지원하지 않습니다.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSearchCenter({ lat, lng });           // ★ 기준(Anchor) 갱신
        setMyPosition({ lat, lng });
        await fetchNearbyRestaurants(lng, lat);  // Kakao: x=lng, y=lat
        seenIdsRef.current = new Set();          // 위치 바뀌면 중복 기록 초기화
      },
      (err) => {
        console.error(err);
        alert('위치를 가져오지 못했습니다.');
      }
    );
  };

  /* === 7) 북마크 토글 === */
  const toggleBookmark = async (id, item) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    const docId = String(id || item?.id);
    try {
      if (bookmarks[docId]) {
        await removeBookmark(user.uid, docId);
      } else {
        await addBookmark(user.uid, { ...item, id: docId });
      }
      setBookmarkRandomSelection(null);
    } catch (e) {
      console.error('북마크 토글 실패:', e);
    }
  };

  // 표시할 리스트 (모드에 따라)
  const displayRestaurants = isBookmarkMode
    ? bookmarkRandomSelection || Object.values(bookmarks)
    : restaurants;

  // 필터/반경이 바뀔 때마다 중복 기록 초기화(선택적)
  useEffect(() => {
    seenIdsRef.current = new Set();
  }, [includedCategory, excludedCategory, radius]);

  return (
    <div className="container">
      {/* 헤더 */}
      <div className="header">
        <h1 className="header-title">오늘 뭐 먹지 ? </h1>

        {user ? (
          <div className="user-info">
            <span className="welcome-msg">환영합니다 {user.displayName}님!</span>
            <button
              className="bookmark-btn"
              onClick={() => setIsBookmarkMode((prev) => !prev)}
              title="북마크 모드 전환"
            >
              {isBookmarkMode ? '일반 모드' : '북마크 모드'}
            </button>
            <button onClick={async () => await signOut(auth)} className="logout-btn">
              로그아웃
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
            >
              로그인
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setAuthModalOpen(true);
              }}
            >
              회원가입
            </button>
          </div>
        )}
      </div>

      {/* 검색 */}
      <div className="search-row">
        <input
          type="text"
          placeholder="주소 또는 건물명 입력"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        <button onClick={handleSearch}>검색</button>
      </div>

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div className="scrollable-list">
          {searchResults.map((result, idx) => (
            <div
              className="search-result-item"
              key={idx}
              onClick={() => handleSelectAddress(result)}
            >
              {result.address_name} {result.place_name ? `(${result.place_name})` : ''}
            </div>
          ))}
        </div>
      )}

      {/* 지도 (Anchor를 center로 사용) */}
      <MapComponent
        mapLoaded={mapLoaded}
        mapCenter={searchCenter} 
        restaurants={displayRestaurants}
        radius={radius}
        myPosition={myPosition}
        bookmarks={bookmarks}
        selectedRestaurant={selectedRestaurant}
      />

      {/* 안내 메시지 */}
      {noIncludedMessage && <div className="result-message">{noIncludedMessage}</div>}

      {/* 리스트 */}
      <RestaurantList
        restaurants={displayRestaurants}
        onSelect={setSelectedRestaurant}
        bookmarks={bookmarks}
        toggleBookmark={toggleBookmark}
      />

      {/* 컨트롤들 */}
      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <button className="location-btn" onClick={handleLocationClick}>
          현위치
        </button>
      </div>

      <RadiusInput setRadius={setRadius} />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <input
          type="number"
          className="recommend-count"
          placeholder="추천 개수"
          value={count || ''}
          onChange={(e) => setCount(Number(e.target.value) || 0)}
        />
        <button className="rand-btn" style={{ width: 210 }} onClick={handleSpin}>
          랜덤 추천
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 0 }}>
        <input
          type="text"
          placeholder="추천할 카테고리 (예: 한식)"
          value={includedCategory}
          onChange={(e) => setIncludedCategory(e.target.value || '')}
        />
        <input
          type="text"
          placeholder="제외할 카테고리 (쉼표로 구분)"
          value={excludedCategory}
          onChange={(e) => setExcludedCategory(e.target.value || '')}
        />
      </div>

      {/* 인증 모달 */}
      <AuthModal mode={authMode} open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default App;

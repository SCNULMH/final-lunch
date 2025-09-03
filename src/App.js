// src/App.js
import React, { useEffect, useRef, useState } from 'react';
import MapComponent from './MapComponent';
import RestaurantList from './RestaurantList';
import SearchBar from './components/SearchBar';
import Controls from './components/Controls';
import useKakaoLoader from './hooks/useKakaoLoader';
import useAuthBookmarks from './hooks/useAuthBookmarks';
import useGeolocation from './hooks/useGeolocation';
import AuthModal from './components/AuthModal';
import { fetchPlacesPage, fetchNearbyRestaurants, fetchAddressAndKeyword } from './services/search';
import './styles.css';

const JS_KEY = process.env.REACT_APP_KAKAO_JS_KEY || '';

export default function App() {
  const mapLoaded = useKakaoLoader(JS_KEY);
  const { user, bookmarks, toggleBookmark, logout } = useAuthBookmarks();
  const { getCurrent } = useGeolocation();

  // 상태
  const [isLoading, setIsLoading] = useState(false);
  const [searchCenter, setSearchCenter] = useState({ lat: 34.9687735, lng: 127.4802359 });
  const [myPosition, setMyPosition] = useState(null);
  const [radius, setRadius] = useState(2000);
  const [address, setAddress] = useState('');
  const [results, setResults] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [included, setIncluded] = useState('');
  const [excluded, setExcluded] = useState('');
  const [count, setCount] = useState(5);
  const [noIncludedMessage, setNoIncludedMessage] = useState('');
  const [isBookmarkMode, setIsBookmarkMode] = useState(false);
  const [bookmarkRandomSelection, setBookmarkRandomSelection] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const seenIdsRef = useRef(new Set());

  // 검색
  const onSearch = async () => {
    if (!address.trim()) return alert('주소를 입력해 주세요.');
    try {
      setIsLoading(true);
      const combined = await fetchAddressAndKeyword(address);
      if (!combined.length) alert('검색 결과가 없습니다.');
      setResults(combined);
    } catch (e) { console.error(e); alert('검색 중 오류가 발생했습니다.'); }
    finally { setIsLoading(false); }
  };

  const onSelectAddress = async (r) => {
    const center = { lat: parseFloat(r.y), lng: parseFloat(r.x) };
    setAddress(r.address_name || r.place_name);
    setSearchCenter(center);
    setResults([]);
    seenIdsRef.current = new Set();
    setIsLoading(true);
    try {
      const list = await fetchNearbyRestaurants({ x: center.lng, y: center.lat, radius });
      setRestaurants(list);
    } finally { setIsLoading(false); }
  };

  // 현위치
  const onLocation = async () => {
    try {
      setIsLoading(true);
      const pos = await getCurrent();
      setSearchCenter(pos); setMyPosition(pos);
      const list = await fetchNearbyRestaurants({ x: pos.lng, y: pos.lat, radius });
      setRestaurants(list);
      seenIdsRef.current = new Set();
    } catch (e) { console.error(e); alert('위치를 가져오지 못했습니다.'); }
    finally { setIsLoading(false); }
  };

  // 랜덤 추천
  const onRandom = async () => {
    if (isLoading) return;
    const pickCount = count || 5;
    setIsLoading(true); setNoIncludedMessage('');

    if (isBookmarkMode) {
      const base = Object.values(bookmarks || {});
      if (!base.length) { alert('북마크한 식당이 없습니다.'); setIsLoading(false); return; }
      const exList = (excluded || '').split(',').map(s => s.trim()).filter(Boolean);
      const inc = (included || '').trim();
      let pool = base.filter(r => {
        const bad = exList.length ? exList.some(c => (r.category_name || '').includes(c)) : false;
        const good = inc ? (r.category_name || '').includes(inc) : true;
        return !bad && good;
      });
      if (!pool.length) {
        setNoIncludedMessage(inc ? `"${inc}" 카테고리가 북마크에 없어 랜덤으로 안내합니다.` : '');
        pool = base.filter(r => !(excluded || '').split(',').some(c => (r.category_name || '').includes(c.trim())));
      }
      const selection = [...pool].sort(() => 0.5 - Math.random()).slice(0, pickCount);
      setBookmarkRandomSelection(selection);
      setIsLoading(false);
      return;
    }

    const x = searchCenter.lng, y = searchCenter.lat;
    const exList = (excluded || '').split(',').map(s => s.trim()).filter(Boolean);
    const inc = (included || '').trim();

    try {
      const first = await fetchPlacesPage({ x, y, radius, include: inc, page: 1, size: 15 });
      const total = Math.min(first?.meta?.pageable_count || 0, 675);
      setNoIncludedMessage(total === 0 && inc ? `"${inc}" 음식점이 주변에 없어 랜덤 음식점을 안내합니다.` : '');

      const totalPages = Math.max(1, Math.min(45, Math.ceil(total / 15)));
      const want = pickCount, bucket = [], usedPages = new Set();
      const notSeen = (r) => !seenIdsRef.current.has(String(r.id));
      const passExclude = (r) => exList.length ? !exList.some(c => (r.category_name || '').includes(c)) : true;

      const pushUnique = (arr) => {
        const set = new Set(bucket.map(d => String(d.id)));
        arr.forEach(d => { if (!set.has(String(d.id))) bucket.push(d); });
      };

      pushUnique((first?.documents || []).filter(passExclude).filter(notSeen));
      for (let t = 0; bucket.length < want && t < 8; t++) {
        let p; for (let g = 0; g < 5; g++) { const cand = 1 + Math.floor(Math.random() * totalPages); if (!usedPages.has(cand)) { p = cand; break; } }
        if (!p) p = 1 + Math.floor(Math.random() * totalPages);
        usedPages.add(p);
        const data = p === 1 ? first : await fetchPlacesPage({ x, y, radius, include: inc, page: p, size: 15 });
        pushUnique((data?.documents || []).filter(passExclude).filter(notSeen));
      }
      if (bucket.length < want) pushUnique((first?.documents || []).filter(passExclude));

      if (!bucket.length) { alert('조건에 맞는 결과가 거의 없어요.'); setIsLoading(false); return; }
      const selection = [...bucket].sort(() => 0.5 - Math.random()).slice(0, want);
      setRestaurants(selection);
      selection.forEach(r => seenIdsRef.current.add(String(r.id)));
      if (seenIdsRef.current.size > 300) {
        seenIdsRef.current = new Set([...seenIdsRef.current].slice(-200));
      }
    } catch (e) { console.error(e); alert('검색 중 오류가 발생했어요.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { seenIdsRef.current = new Set(); }, [included, excluded, radius]);

  const displayRestaurants = isBookmarkMode
    ? bookmarkRandomSelection || Object.values(bookmarks)
    : restaurants;

  return (
    <div className="container">
      {/* 헤더 */}
      <div className="header">
        <h1 className="header-title">오늘 뭐 먹지?</h1>
    {user ? (
      <div className="user-info">
        <span className="welcome-msg">환영합니다 {user.displayName}님!</span>
        <button className="bookmark-btn" onClick={() => setIsBookmarkMode(v => !v)}>
          {isBookmarkMode ? '일반 모드' : '북마크 모드'}
        </button>
        <button onClick={logout} className="logout-btn">로그아웃</button>
      </div>
    ) : (
      <div className="auth-buttons">
        <button onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>로그인</button>
        <button onClick={() => { setAuthMode('signup'); setAuthOpen(true); }}>회원가입</button>
      </div>
    )}

    <AuthModal
      mode={authMode}
      open={authOpen}
      onClose={() => setAuthOpen(false)}
    />
          </div>

      {/* 검색 */}
      <SearchBar
        address={address}
        setAddress={setAddress}
        results={results}
        onSearch={onSearch}
        onSelect={onSelectAddress}
        loading={isLoading}
      />

      {/* 지도 */}
      <MapComponent
        mapLoaded={mapLoaded}
        mapCenter={searchCenter}
        restaurants={displayRestaurants}
        radius={radius}
        myPosition={myPosition}
        bookmarks={bookmarks}
        selectedRestaurant={selectedRestaurant}
      />

      {noIncludedMessage && <div className="result-message">{noIncludedMessage}</div>}

      {/* 리스트 */}
      <RestaurantList
        restaurants={displayRestaurants}
        onSelect={setSelectedRestaurant}
        bookmarks={bookmarks}
        toggleBookmark={toggleBookmark}
      />

      {/* 컨트롤 */}
      <Controls
        isLoading={isLoading}
        onLocation={onLocation}
        radius={radius} setRadius={setRadius}
        count={count} setCount={setCount}
        included={included} setIncluded={setIncluded}
        excluded={excluded} setExcluded={setExcluded}
        onRandom={onRandom}
      />
    </div>
  );
}
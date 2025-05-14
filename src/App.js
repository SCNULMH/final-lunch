import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import RestaurantList from './RestaurantList';
import RadiusInput from './RadiusInput';
import AuthModal from './components/AuthModal';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import './styles.css';

const App = () => {
  // 상태 선언
  const [myPosition, setMyPosition] = useState(null);
  const [radius, setRadius] = useState(2000);
  const [address, setAddress] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [count, setCount] = useState(0);
  const [excludedCategory, setExcludedCategory] = useState('');
  const [includedCategory, setIncludedCategory] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 34.9687735, lng: 127.4802359 });
  const [searchResults, setSearchResults] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [noIncludedMessage, setNoIncludedMessage] = useState(""); // 안내 메시지
  const [user, setUser] = useState(null); // Firebase 로그인 유저

  const REST_API_KEY = '25d26859dae2a8cb671074b910e16912';
  const JAVASCRIPT_API_KEY = '51120fdc1dd2ae273ccd643e7a301c77';

  // Firebase 로그인 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 로그아웃
  const handleLogout = async () => {
    await signOut(auth);
  };

  // 주소 및 키워드 검색
  const fetchAddressData = async (query) => {
    const addressUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
    const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&category_group_code=AT4`;

    try {
      const [addressResponse, keywordResponse] = await Promise.all([
        fetch(addressUrl, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }),
        fetch(keywordUrl, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }),
      ]);
      if (!addressResponse.ok || !keywordResponse.ok) {
        throw new Error(`검색 실패: ${addressResponse.status} ${addressResponse.statusText}`);
      }

      const addressData = await addressResponse.json();
      const keywordData = await keywordResponse.json();

      const combinedResults = [
        ...(addressData.documents || []),
        ...(keywordData.documents || [])
      ];

      // 결과가 없을 때 fallback 검색
      if (combinedResults.length === 0) {
        const fallbackKeywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
        const fallbackResponse = await fetch(fallbackKeywordUrl, {
          headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setSearchResults(fallbackData.documents || []);
        } else {
          alert("검색 결과가 없습니다.");
        }
      } else {
        setSearchResults(combinedResults);
      }
    } catch (error) {
      console.error("검색 중 오류 발생:", error);
      alert("검색 중 오류가 발생했습니다.");
    }
  };

  // 근처 식당 검색 (모든 페이지 요청)
  const fetchNearbyRestaurants = async (x, y) => {
    let allRestaurants = [];
    for (let page = 1; page <= 3; page++) {
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=식당&x=${x}&y=${y}&radius=${radius}&page=${page}`;
      try {
        const response = await fetch(url, {
          headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
        });
        if (!response.ok) break;
        const data = await response.json();
        if (data.documents && data.documents.length > 0) {
          allRestaurants = [...allRestaurants, ...data.documents];
          if (data.documents.length < 15) break;
        } else {
          break;
        }
      } catch (error) {
        console.error("페이지 요청 실패:", error);
        break;
      }
    }
    if (allRestaurants.length > 0) {
      setRestaurants(allRestaurants);
    } else {
      alert("근처에 식당이 없습니다.");
    }
  };

  // 주소 검색 실행
  const handleSearch = async () => {
    if (!address) {
      alert("주소를 입력해 주세요.");
      return;
    }
    await fetchAddressData(address);
  };

  // 검색 결과에서 주소 선택
  const handleSelectAddress = (result) => {
    setAddress(result.address_name);
    setMapCenter({ lat: parseFloat(result.y), lng: parseFloat(result.x) });
    fetchNearbyRestaurants(result.x, result.y);
    setSearchResults([]);
  };

  // 식당 클릭 시
  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  // 랜덤 추천 (포함/제외 카테고리, 5개 랜덤)
  const handleSpin = () => {
    if (restaurants.length === 0) {
      alert("식당 목록이 비어 있습니다. 주소를 검색해 주세요.");
      return;
    }

    const excludedCategories = excludedCategory
      .split(',')
      .map((cat) => cat.trim())
      .filter((cat) => cat.length > 0);
    const included = includedCategory.trim();

    // 1. 필터링: 제외 카테고리, 포함 카테고리
    const filteredRestaurants = restaurants.filter((restaurant) => {
      const isExcluded = excludedCategories.length > 0
        ? excludedCategories.some(cat => restaurant.category_name.includes(cat))
        : false;
      const isIncluded = included.length > 0
        ? restaurant.category_name.includes(included)
        : true;
      return !isExcluded && isIncluded;
    });

    // 2. 최종 후보 결정
    let finalSelection = [];
    let message = "";

    if (filteredRestaurants.length === 0) {
      if (included) {
        message = `"${included}" 음식점이 주변에 없어 랜덤 음식점을 안내합니다.`;
      }
      const notExcluded = restaurants.filter((restaurant) => {
        const isExcluded = excludedCategories.some(cat =>
          restaurant.category_name.includes(cat)
        );
        return !isExcluded;
      });
      finalSelection = notExcluded;
    } else {
      finalSelection = filteredRestaurants;
    }

    setNoIncludedMessage(message);

    // 랜덤 추천 (count 값이 없으면 기본 5개)
    const randomSelection = finalSelection
      .sort(() => 0.5 - Math.random())
      .slice(0, count || 5);

    setRestaurants(randomSelection);
    if (randomSelection.length > 0) {
      setMapCenter({
        lat: parseFloat(randomSelection[0].y),
        lng: parseFloat(randomSelection[0].x),
      });
    }
  };

  // 현위치 버튼 클릭
  const handleLocationClick = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter({ lat, lng });
        setMyPosition({ lat, lng });
        await fetchNearbyRestaurants(lng, lat);
      }, (error) => {
        console.error('위치를 가져오지 못했습니다: ', error);
        alert('위치를 가져오지 못했습니다.');
      });
    } else {
      alert('이 브라우저는 Geolocation을 지원하지 않습니다.');
    }
  };

  // 카카오맵 스크립트 로드
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JAVASCRIPT_API_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => setMapLoaded(true));
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div className="container">
      {/* 상단 헤더 */}
      <div className="header">
  <h1>오늘 뭐 먹지 ? </h1>
  {user ? (
    <div className="user-info">
      <span className="welcome-msg">
        환영합니다 {user.displayName}님!
      </span>
      <button className="bookmark-btn">북마크</button>
      <button onClick={handleLogout} className="logout-btn">
        로그아웃
      </button>
    </div>
  ) : (
    <div className="auth-buttons">
      <button onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}>로그인</button>
      <button onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}>회원가입</button>
    </div>
  )}
</div>


      <div className="search-row">
        <input
          type="text"
          placeholder="주소 또는 건물명 입력"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <button onClick={handleSearch}>검색</button>
      </div>
      
      {searchResults.length > 0 && (
        <div className="scrollable-list">
          {searchResults.map((result, index) => (
            <div key={index} onClick={() => handleSelectAddress(result)}>
              {result.address_name} {result.place_name ? `(${result.place_name})` : ''}
            </div>
          ))}
        </div>
      )}

      <MapComponent
        mapLoaded={mapLoaded}
        mapCenter={mapCenter}
        restaurants={restaurants}
        radius={radius}
        myPosition={myPosition}
      />

      {/* 안내 메시지 표시 */}
      {noIncludedMessage && (
        <div className="result-message">{noIncludedMessage}</div>
      )}

      <RestaurantList restaurants={restaurants} onSelect={handleSelectRestaurant} />

      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <button onClick={handleLocationClick}>현위치</button>
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
        <button style={{ width: '210px' }} onClick={handleSpin}>랜덤 추천</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0px' }}>
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
      <AuthModal
        mode={authMode}
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};

export default App;

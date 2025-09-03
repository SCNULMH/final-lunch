// src/MapComponent.js
import React, { useEffect, useRef } from 'react';

const RED_MARKER_IMG  = `${process.env.PUBLIC_URL}/markers/일반.png`;     // 일반
const BLUE_MARKER_IMG = `${process.env.PUBLIC_URL}/markers/즐겨찾기.png`; // 북마크
const SPOT_MARKER_IMG = `${process.env.PUBLIC_URL}/markers/현위치.png`;   // 내 위치

// 원하는 크기만 숫자 바꿔도 됨
const SIZES = {
  normal:   { w: 36, h: 36 }, // 일반/즐겨찾기
  favorite: { w: 42, h: 42 },
  spot:     { w: 22, h: 32 }, // 현위치
};

function createMarkerImage(kakao, imgUrl) {
  if (!kakao) return null;

  const which =
    imgUrl === SPOT_MARKER_IMG ? 'spot' :
    imgUrl === BLUE_MARKER_IMG ? 'favorite' : 'normal';

  const { w, h } = SIZES[which];
  const ax = Math.round(w / 2);
  const ay = h;

  return new kakao.maps.MarkerImage(
    imgUrl,
    new kakao.maps.Size(w, h),
    { offset: new kakao.maps.Point(ax, ay) }
  );
}

const MapComponent = ({
  mapLoaded,
  restaurants = [],
  mapCenter,
  radius,
  myPosition,
  bookmarks = {},
  /** 리스트에서 선택된 식당(선택) */
  selectedRestaurant = null,
}) => {
  const containerRef   = useRef(null);
  const mapRef         = useRef(null);      // kakao.maps.Map
  const myMarkerRef    = useRef(null);      // 내 위치 마커
  const circleRef      = useRef(null);      // 반경 원
  const markersRef     = useRef([]);        // 모든 마커 배열
  const markerByIdRef  = useRef(new Map()); // id -> marker
  const infoRef        = useRef(null);      // 공용 InfoWindow
  
  // 1) 지도 최초 생성 (한 번만)
  useEffect(() => {
    if (!mapLoaded || !window.kakao || mapRef.current || !containerRef.current) return;
    const { kakao } = window;

    mapRef.current = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
      level: 4,
    });

    const zoomControl = new kakao.maps.ZoomControl();
    mapRef.current.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
  }, [mapLoaded, mapCenter]);

  useEffect(() => {
  const { kakao } = window;
    if (!kakao) return;

    const handleCloseInfo = () => {
      if (infoRef.current) infoRef.current.close();
    };
    document.addEventListener('closeInfo', handleCloseInfo);

    return () => {
      document.removeEventListener('closeInfo', handleCloseInfo);
    };
  }, []);
  // 2) 지도 중심 이동(앵커 변경 시에만)
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;
    const { kakao } = window;
    const center = new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng);
    mapRef.current.setCenter(center);
  }, [mapCenter]);

  // 3) 내 위치 마커 업데이트
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;
    const { kakao } = window;

    if (myMarkerRef.current) {
      myMarkerRef.current.setMap(null);
      myMarkerRef.current = null;
    }
    if (myPosition?.lat && myPosition?.lng) {
      const pos = new kakao.maps.LatLng(myPosition.lat, myPosition.lng);
      const marker = new kakao.maps.Marker({
        position: pos,
        image: createMarkerImage(kakao, SPOT_MARKER_IMG),
        title: '내 위치',
        zIndex: 10,
      });
      marker.setMap(mapRef.current);
      myMarkerRef.current = marker;

      const info = new kakao.maps.InfoWindow({
        content: '<div style="padding:5px;color:#d32f2f;">내 위치</div>',
      });
      info.open(mapRef.current, marker);
    }
  }, [myPosition]);

  // 4) 반경 원 업데이트 (center/radius 변경 시)
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;
    const { kakao } = window;

    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
    const center = new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng);
    circleRef.current = new kakao.maps.Circle({
      map: mapRef.current,
      center,
      radius,
      strokeWeight: 2,
      strokeColor: '#75B8FA',
      strokeOpacity: 0.7,
      fillColor: '#CFE7FF',
      fillOpacity: 0.5,
    });
  }, [mapCenter, radius]);

  // 5) 식당 마커 업데이트
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;
    const { kakao } = window;

    // 기존 마커 정리
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    markerByIdRef.current.clear();

    if (!infoRef.current) {
      infoRef.current = new kakao.maps.InfoWindow({ removable: true });
    }

    restaurants.forEach((r) => {
      const lat = parseFloat(r.y);
      const lng = parseFloat(r.x);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const isBookmarked = !!bookmarks[String(r.id)];
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(lat, lng),
        title: r.place_name,
        image: createMarkerImage(kakao, isBookmarked ? BLUE_MARKER_IMG : RED_MARKER_IMG),
      });
      marker.setMap(mapRef.current);

      const detailUrl =
        r.place_url ||
        `https://map.kakao.com/link/search/${encodeURIComponent(r.place_name || '')}`;

      const html =
      `<div style="padding:8px 10px; position:relative; max-width:200px;">
        <div style="font-weight:bold;margin-bottom:4px;">
          ${r.place_name || ''}
        </div>
        <div style="font-size:12px;color:#666;margin-bottom:6px;">
          ${r.road_address_name || r.address_name || ''}
        </div>
        <a href="${detailUrl}" target="_blank" rel="noreferrer"
          style="display:inline-block;padding:6px 10px;background:#43A047;color:#fff;border-radius:8px;font-size:12px;text-decoration:none;">
          상세보기
        </a>
        </div>`;


      // 단일 클릭: 인포윈도우 열고 패닝
      kakao.maps.event.addListener(marker, 'click', () => {
        infoRef.current.setContent(html);
        infoRef.current.open(mapRef.current, marker);
        mapRef.current.panTo(marker.getPosition());
      });

      // 더블 클릭: 새 탭으로 상세 페이지
      kakao.maps.event.addListener(marker, 'dblclick', () => {
        window.open(detailUrl, '_blank', 'noopener,noreferrer');
      });

      markersRef.current.push(marker);
      const key = String(r.id ?? `${lat},${lng}`);
      markerByIdRef.current.set(key, marker);
    });

    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      markerByIdRef.current.clear();
    };
  }, [restaurants, bookmarks]);

  // 6) 리스트에서 선택된 식당이 바뀌면 부드럽게 패닝 + 인포윈도우 표시
  useEffect(() => {
    if (!selectedRestaurant || !mapRef.current || !window.kakao) return;
    const { kakao } = window;

    const key = String(selectedRestaurant.id ?? `${selectedRestaurant.y},${selectedRestaurant.x}`);
    const marker = markerByIdRef.current.get(key);

    const lat = parseFloat(selectedRestaurant.y);
    const lng = parseFloat(selectedRestaurant.x);
    const pos = (!Number.isNaN(lat) && !Number.isNaN(lng))
      ? new kakao.maps.LatLng(lat, lng)
      : null;

    // 마커가 이미 있으면 그 마커로, 없으면 좌표로 이동
    if (marker) {
      mapRef.current.panTo(marker.getPosition());
      kakao.maps.event.trigger(marker, 'click'); // 클릭 이벤트 강제 → 인포윈도우 표시
    } else if (pos) {
      mapRef.current.panTo(pos);
    }
  }, [selectedRestaurant]);

  // 7) 언마운트 클린업
  useEffect(() => {
    return () => {
      if (myMarkerRef.current) myMarkerRef.current.setMap(null);
      if (circleRef.current)   circleRef.current.setMap(null);
      if (markersRef.current.length) {
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];
      }
      markerByIdRef.current.clear();
      if (infoRef.current) {
        infoRef.current.close();
        infoRef.current = null;
      }
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="map"
      className="map-area"
    />
  );
};

export default MapComponent;

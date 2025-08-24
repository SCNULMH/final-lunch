// src/MapComponent.js
import React, { useEffect, useRef } from 'react';

const RED_MARKER_IMG  = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
const BLUE_MARKER_IMG = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'; // 북마크(별)
const SPOT_MARKER_IMG = 'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png'; // 내 위치

function createMarkerImage(kakao, imgUrl) {
  if (!kakao) return null;
  if (imgUrl === SPOT_MARKER_IMG) {
    const size = new kakao.maps.Size(24, 35);
    const opt  = { offset: new kakao.maps.Point(12, 35) };
    return new kakao.maps.MarkerImage(imgUrl, size, opt);
  } else {
    const size = new kakao.maps.Size(64, 69);
    const opt  = { offset: new kakao.maps.Point(27, 69) };
    return new kakao.maps.MarkerImage(imgUrl, size, opt);
  }
}

const MapComponent = ({
  mapLoaded,
  restaurants = [],
  mapCenter,
  radius,
  myPosition,
  bookmarks = {}
}) => {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);      // kakao.maps.Map
  const myMarkerRef  = useRef(null);      // 내 위치 마커
  const circleRef    = useRef(null);      // 반경 원
  const markersRef   = useRef([]);        // 식당 마커들
  const infoRef      = useRef(null);      // 공용 InfoWindow

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

  // 2) 지도 중심 이동
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

    // 기존 마커 제거
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

      // 간단한 인포
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

    // 기존 원 제거
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    const center = new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng);
    circleRef.current = new kakao.maps.Circle({
      map: mapRef.current,
      center,
      radius: radius,
      strokeWeight: 2,
      strokeColor: '#75B8FA',
      strokeOpacity: 0.7,
      fillColor: '#CFE7FF',
      fillOpacity: 0.5,
    });
  }, [mapCenter, radius]);

  // 5) 식당 마커 업데이트 (목록/북마크 변경 시)
  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;
    const { kakao } = window;

    // 기존 마커 제거
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // 인포윈도우 없으면 생성
    if (!infoRef.current) {
      infoRef.current = new kakao.maps.InfoWindow({ removable: false });
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

      kakao.maps.event.addListener(marker, 'click', () => {
        const html = `
          <div style="padding:8px 10px;">
            <div style="font-weight:bold;margin-bottom:4px;">${r.place_name || ''}</div>
            <div style="font-size:12px;color:#666;">${r.road_address_name || r.address_name || ''}</div>
          </div>`;
        infoRef.current.setContent(html);
        infoRef.current.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // cleanup: 언마운트 시 마커 제거
    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
    };
  }, [restaurants, bookmarks]);

  // 6) 언마운트 클린업
  useEffect(() => {
    return () => {
      if (myMarkerRef.current) myMarkerRef.current.setMap(null);
      if (circleRef.current)   circleRef.current.setMap(null);
      if (markersRef.current.length) {
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];
      }
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
      className="map-area"   // styles.css의 디자인과 맞춤
      // 스타일이 필요하면 아래 높이 조절 (기본은 .map-area가 220px)
      // style={{ height: 260 }}
    />
  );
};

export default MapComponent;

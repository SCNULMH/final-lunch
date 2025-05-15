// src/MapComponent.js

import React, { useEffect, useRef } from 'react';

const RED_MARKER_IMG = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
const BLUE_MARKER_IMG = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'; // 북마크 마커(노란별)
const SPOT_MARKER_IMG = 'http://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png'; // 내 위치 마커

const MapComponent = ({ 
  mapLoaded, 
  restaurants, 
  mapCenter, 
  radius, 
  myPosition,
  bookmarks
}) => {
  const mapRef = useRef(null);
  const myMarkerRef = useRef(null);

  // 마커 이미지 생성 함수
  const createMarkerImage = (imgUrl) => {
    // spot 마커는 사이즈가 다르므로 예외 처리
    if (imgUrl === SPOT_MARKER_IMG) {
      const imageSize = new window.kakao.maps.Size(24, 35);
      const imageOption = { offset: new window.kakao.maps.Point(12, 35) };
      return new window.kakao.maps.MarkerImage(imgUrl, imageSize, imageOption);
    } else {
      const imageSize = new window.kakao.maps.Size(64, 69);
      const imageOption = { offset: new window.kakao.maps.Point(27, 69) };
      return new window.kakao.maps.MarkerImage(imgUrl, imageSize, imageOption);
    }
  };

  // 원 추가 함수
  const addCircle = (map, position) => {
    new window.kakao.maps.Circle({
      map: map,
      center: position,
      radius: radius,
      strokeWeight: 2,
      strokeColor: '#75B8FA',
      strokeOpacity: 0.7,
      fillColor: '#CFE7FF',
      fillOpacity: 0.5
    });
  };

  useEffect(() => {
    if (!mapLoaded || !window.kakao) return;

    const { kakao } = window;
    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
      level: 4,
    });

    // 내 위치 마커 (spot 마커로 변경)
    if (myPosition?.lat && myPosition?.lng) {
      const pos = new kakao.maps.LatLng(myPosition.lat, myPosition.lng);
      
      if (myMarkerRef.current) myMarkerRef.current.setMap(null);
      
      const myMarker = new kakao.maps.Marker({
        position: pos,
        image: createMarkerImage(SPOT_MARKER_IMG),
        title: "내 위치"
      });
      myMarker.setMap(map);
      myMarkerRef.current = myMarker;

      new kakao.maps.InfoWindow({
        content: '<div style="padding:5px; color:#d32f2f;">내 위치</div>'
      }).open(map, myMarker);
      
      map.setCenter(pos);
    }

    // 식당 마커 추가 (북마크 여부에 따라 색상 변경)
    restaurants.forEach((restaurant) => {
      const isBookmarked = !!bookmarks[restaurant.id];
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(restaurant.y, restaurant.x),
        title: restaurant.place_name,
        image: createMarkerImage(isBookmarked ? BLUE_MARKER_IMG : RED_MARKER_IMG)
      });
      marker.setMap(map);
    });

    addCircle(map, new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng));
  }, [mapLoaded, mapCenter, restaurants, radius, myPosition, bookmarks]);

  return <div ref={mapRef} id="map" style={{ width: '100%', height: '400px' }} />;
};

export default MapComponent;

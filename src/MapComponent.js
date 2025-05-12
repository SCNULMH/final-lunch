import React, { useEffect, useRef } from 'react';

const RED_MARKER_IMG = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';

const MapComponent = ({ mapLoaded, restaurants, mapCenter, radius, myPosition }) => {
  const mapRef = useRef(null);
  const myMarkerRef = useRef(null);

  // 원 추가 함수
  const addCircle = (map, position) => {
    const circle = new window.kakao.maps.Circle({
      center: position,
      radius: radius,
      strokeWeight: 2,
      strokeColor: '#75B8FA',
      strokeOpacity: 0.7,
      fillColor: '#CFE7FF',
      fillOpacity: 0.5,
    });
    circle.setMap(map);
  };

  useEffect(() => {
    if (!mapLoaded || !window.kakao) return;

    const { kakao } = window;
    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
      level: 3,
    });

    // 내 위치 마커 추가 (빨간색)
    if (myPosition && myPosition.lat && myPosition.lng) {
      const pos = new kakao.maps.LatLng(myPosition.lat, myPosition.lng);

      // 기존 마커 제거
      if (myMarkerRef.current) {
        myMarkerRef.current.setMap(null);
      }

      // 빨간 마커 이미지 (공식 사이즈/옵션)
      const imageSize = new kakao.maps.Size(64, 69);
      const imageOption = { offset: new kakao.maps.Point(27, 69) };
      const markerImage = new kakao.maps.MarkerImage(
        RED_MARKER_IMG,
        imageSize,
        imageOption
      );

      // 마커 생성
      const myMarker = new kakao.maps.Marker({
        position: pos,
        image: markerImage,
        title: "내 위치",
      });
      myMarker.setMap(map);
      myMarkerRef.current = myMarker;

      // 인포윈도우(말풍선)
      const infowindow = new kakao.maps.InfoWindow({
        content: '<div style="padding:5px; color:#d32f2f;">내 위치</div>',
      });
      infowindow.open(map, myMarker);

      // 지도 중심 이동
      map.setCenter(pos);
    }

    // 레스토랑 마커 추가
    restaurants.forEach((restaurant) => {
      const markerPosition = new kakao.maps.LatLng(restaurant.y, restaurant.x);
      const marker = new kakao.maps.Marker({
        position: markerPosition,
        title: restaurant.place_name,
      });
      marker.setMap(map);
    });

    // 반경 원 추가
    addCircle(map, new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng));
  }, [mapLoaded, mapCenter, restaurants, radius, myPosition]);

  return <div ref={mapRef} id="map" style={{ width: '100%', height: '400px' }} />;
};

export default MapComponent;

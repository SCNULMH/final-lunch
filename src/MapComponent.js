import React, { useEffect, useRef } from 'react';

const RED_MARKER_IMG = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';

const MapComponent = ({ mapLoaded, restaurants, mapCenter, radius, myPosition }) => {
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
    if (mapLoaded && window.kakao) {
      const container = document.getElementById('map');
      const options = {
        center: new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
        level: 3,
      };

      const map = new window.kakao.maps.Map(container, options);

      // 내 위치 마커 추가 (빨간색)
      if (myPosition) {
        const pos = new window.kakao.maps.LatLng(myPosition.lat, myPosition.lng);
        const imageSize = new window.kakao.maps.Size(32, 32);
        const markerImage = new window.kakao.maps.MarkerImage(RED_MARKER_IMG, imageSize);

        // 기존 마커 삭제
        if (myMarkerRef.current) myMarkerRef.current.setMap(null);

        // 새 마커 생성
        const myMarker = new window.kakao.maps.Marker({
          position: pos,
          image: markerImage,
          title: "내 위치",
        });
        myMarker.setMap(map);
        myMarkerRef.current = myMarker;

        // 인포윈도우(말풍선)도 표시
        const infowindow = new window.kakao.maps.InfoWindow({
          content: '<div style="padding:5px; color:#d32f2f;">내 위치</div>',
        });
        infowindow.open(map, myMarker);

        // 지도 중심 이동
        map.setCenter(pos);
      }

      // 레스토랑 위치에 마커 추가
      restaurants.forEach((restaurant) => {
        const markerPosition = new window.kakao.maps.LatLng(restaurant.y, restaurant.x);
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          title: restaurant.place_name,
        });
        marker.setMap(map);
      });

      // 원 추가
      addCircle(map, new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng));
    }
  }, [mapLoaded, mapCenter, restaurants, radius, myPosition]);

  return <div id="map" style={{ width: '100%', height: '400px' }}></div>;
};

export default MapComponent;

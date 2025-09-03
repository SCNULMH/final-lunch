// src/hooks/useGeolocation.js
export default function useGeolocation() {
  const getCurrent = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('지원 안함'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err)
      );
    });
  return { getCurrent };
}

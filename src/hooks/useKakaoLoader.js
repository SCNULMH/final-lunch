// src/hooks/useKakaoLoader.js
import { useEffect, useState } from 'react';

export default function useKakaoLoader(appKey) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => setLoaded(true));
    document.head.appendChild(script);
  }, [appKey]);

  return loaded;
}

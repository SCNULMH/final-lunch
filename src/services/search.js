// src/services/search.js
const REST_API_KEY = process.env.REACT_APP_KAKAO_REST_KEY || '';
const KAKAO_HEADERS = { Authorization: `KakaoAK ${REST_API_KEY}` };

export async function fetchPlacesPage({ x, y, radius, include = '', page = 1, size = 15 }) {
  const q = include?.trim() ? `${include.trim()} 식당` : '식당';
  const url =
    `https://dapi.kakao.com/v2/local/search/keyword.json` +
    `?query=${encodeURIComponent(q)}&x=${x}&y=${y}&radius=${radius}&page=${page}&size=${size}`;
  const res = await fetch(url, { headers: KAKAO_HEADERS });
  if (!res.ok) throw new Error('카카오 검색 실패');
  return res.json();
}

export async function fetchNearbyRestaurants({ x, y, radius }) {
  const urlBase = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent('식당')}`;
  let all = [];
  for (let page = 1; page <= 3; page++) {
    const url = `${urlBase}&x=${x}&y=${y}&radius=${radius}&page=${page}`;
    const res = await fetch(url, { headers: KAKAO_HEADERS });
    if (!res.ok) break;
    const data = await res.json();
    const docs = data?.documents || [];
    if (!docs.length) break;
    all = all.concat(docs);
    if (docs.length < 15) break;
  }
  return all;
}

export async function fetchAddressAndKeyword(query) {
  const addressUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
  const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
  const [addressRes, keywordRes] = await Promise.all([
    fetch(addressUrl, { headers: KAKAO_HEADERS }),
    fetch(keywordUrl, { headers: KAKAO_HEADERS }),
  ]);
  if (!addressRes.ok || !keywordRes.ok) throw new Error('검색 실패');
  const addressData = await addressRes.json();
  const keywordData = await keywordRes.json();
  return [...(addressData.documents || []), ...(keywordData.documents || [])];
}

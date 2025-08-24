// functions/index.js
const { onRequest } = require('firebase-functions/v2/https');

// .env에서 읽어옴 (에뮬레이터/배포 시 자동 주입)
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;

function normalizePath(path) {
  let p = (path || '').replace(/^\/+/, '');
  if (p.startsWith('api/')) p = p.slice(4);
  return p;
}

exports.api = onRequest({ cors: true }, async (req, res) => {
  try {
    if (!KAKAO_REST_API_KEY) {
      return res.status(500).json({ error: 'Missing KAKAO_REST_API_KEY' });
    }

    const path = normalizePath(req.path);
    const q = req.query;
    const headers = { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` };

    if (path === 'kakao/combined') {
      const keyword = q.q || '';
      const addrURL = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(keyword)}`;
      const keywURL = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`;
      const [addrRes, keywRes] = await Promise.all([fetch(addrURL, { headers }), fetch(keywURL, { headers })]);
      if (!addrRes.ok || !keywRes.ok) throw new Error('Kakao combined failed');
      const [addr, keyw] = await Promise.all([addrRes.json(), keywRes.json()]);
      return res.json({ documents: [...(addr.documents || []), ...(keyw.documents || [])] });
    }

    if (path === 'kakao/nearby') {
      const { x, y, radius, page = 1, size = 15 } = q;
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent('식당')}&x=${x}&y=${y}&radius=${radius}&page=${page}&size=${size}`;
      const r = await fetch(url, { headers });
      if (!r.ok) throw new Error('Kakao nearby failed');
      return res.json(await r.json());
    }

    if (path === 'kakao/places') {
      const { q: query = '식당', x, y, radius, page = 1, size = 15 } = q;
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&x=${x}&y=${y}&radius=${radius}&page=${page}&size=${size}`;
      const r = await fetch(url, { headers });
      if (!r.ok) throw new Error('Kakao places failed');
      return res.json(await r.json());
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
});

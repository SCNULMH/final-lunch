// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const cfg = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// ✅ 디버그: 값 들어오는지 콘솔에서 확인(앞/뒤만 표시)
if (!cfg.apiKey) {
  console.error("[Firebase] REACT_APP_FIREBASE_API_KEY 가 비어있습니다 (.env.local 확인)");
}
console.log("[Firebase] config check", {
  apiKey: (cfg.apiKey || "").slice(0, 6) + "..." + (cfg.apiKey || "").slice(-4),
  projectId: cfg.projectId,
  authDomain: cfg.authDomain,
});

const app = initializeApp(cfg);
export const auth = getAuth(app);
export const db = getFirestore(app);

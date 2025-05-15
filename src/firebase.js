// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDV9eBomaHDkxu9KV-oZvLfiywAG8bTCn8",
  authDomain: "lunch-b805b.firebaseapp.com",
  projectId: "lunch-b805b",
  storageBucket: "lunch-b805b.appspot.com", // ← .app이 아니라 .com!
  messagingSenderId: "1010653253450",
  appId: "1:1010653253450:web:a4f5bb7bbefe6a5dea7bb3",
  measurementId: "G-K8SV1P4NHH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);



import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDV9eBomaHDkxu9KV-oZvLfiywAG8bTCn8",
  authDomain: "lunch-b805b.firebaseapp.com",
  projectId: "lunch-b805b",
  storageBucket: "lunch-b805b.appspot.com",
  messagingSenderId: "1010653253450",
  appId: "" 
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

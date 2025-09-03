// src/hooks/useAuthBookmarks.js
import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { subscribeBookmarks, addBookmark, removeBookmark } from '../services/bookmark';

export default function useAuthBookmarks() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState({});
  const bookmarkUnsubRef = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (bookmarkUnsubRef.current) {
        bookmarkUnsubRef.current();
        bookmarkUnsubRef.current = null;
      }
      if (currentUser) {
        bookmarkUnsubRef.current = subscribeBookmarks(currentUser.uid, (data) => setBookmarks({ ...data }));
      } else {
        setBookmarks({});
      }
    });
    return () => {
      if (bookmarkUnsubRef.current) bookmarkUnsubRef.current();
      unsubAuth();
    };
  }, []);

  const toggleBookmark = async (id, item) => {
    if (!user) { alert('로그인이 필요합니다.'); return; }
    const docId = String(id || item?.id);
    try {
      if (bookmarks[docId]) await removeBookmark(user.uid, docId);
      else await addBookmark(user.uid, { ...item, id: docId });
    } catch (e) { console.error('북마크 토글 실패:', e); }
  };

  const logout = async () => { await signOut(auth); };

  return { user, bookmarks, toggleBookmark, logout };
}

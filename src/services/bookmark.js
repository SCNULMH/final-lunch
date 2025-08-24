// src/services/bookmark.js
import { db } from '../firebase';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';

/**
 * 북마크 추가/수정
 * - bookmarkData.id 는 문자열로 통일해 저장
 */
export const addBookmark = async (userId, bookmarkData) => {
  const docId = String(bookmarkData.id ?? '');
  if (!docId) throw new Error('Invalid bookmark id');
  await setDoc(
    doc(db, 'users', userId, 'bookmarks', docId),
    { ...bookmarkData, id: docId },
    { merge: true }
  );
};

/**
 * 북마크 삭제
 */
export const removeBookmark = async (userId, bookmarkId) => {
  const docId = String(bookmarkId ?? '');
  if (!docId) throw new Error('Invalid bookmark id');
  await deleteDoc(doc(db, 'users', userId, 'bookmarks', docId));
};

/**
 * 북마크 실시간 구독
 * - 콜백으로 { [id]: bookmarkData } 형태 전달
 * - 실패 시 콘솔 로깅 후 빈 객체 전달
 */
export const subscribeBookmarks = (userId, callback) => {
  const colRef = collection(db, 'users', userId, 'bookmarks');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const map = {};
      snapshot.forEach((d) => {
        map[d.id] = d.data();
      });
      callback(map);
    },
    (error) => {
      console.error('북마크 구독 오류:', error);
      callback({});
    }
  );
};

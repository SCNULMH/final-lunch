import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

const AuthModal = ({ mode, open, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'signup') {
        // 회원가입 + 닉네임 저장
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: nickname });
        alert('회원가입 성공! 🎉');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert('로그인 성공! 😊');
      }
      onClose();
    } catch (error) {
  let message = '';
  switch (error.code) {
    case 'auth/email-already-in-use':
      message = '이미 가입된 이메일입니다.'; break;
    case 'auth/user-not-found':
      message = '가입되지 않은 이메일입니다.'; break;
    case 'auth/wrong-password':
      message = '비밀번호가 일치하지 않습니다.'; break;
    case 'auth/weak-password':
      message = '비밀번호는 6자 이상이어야 합니다.'; break;
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      message = '이메일 또는 비밀번호가 올바르지 않습니다.'; break;
    default:
      message = `오류: ${error.message}`;
  }
  alert(message);
}

  };

  return (
    <div className="modal-backdrop">
      <div className="auth-modal">
        <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <div className="auth-buttons">
            <button type="submit">{mode === 'login' ? '로그인' : '가입하기'}</button>
            <button type="button" onClick={onClose}>취소</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;

// src/components/AuthModal.js
import React, { useEffect, useState, useCallback } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

const AuthModal = ({ mode = 'login', open = false, onClose = () => {} }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // 모달 열릴 때 입력값 초기화
  useEffect(() => {
    if (open) {
      setEmail('');
      setPassword('');
      setNickname('');
      setShowPw(false);
      setLoading(false);
    }
  }, [open, mode]);

  // ESC 닫기
  const onEsc = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onEsc]);

  if (!open) return null;

  const errToMsg = (error) => {
    switch (error?.code) {
      case 'auth/email-already-in-use': return '이미 가입된 이메일입니다.';
      case 'auth/user-not-found': return '가입되지 않은 이메일입니다.';
      case 'auth/wrong-password': return '비밀번호가 일치하지 않습니다.';
      case 'auth/weak-password': return '비밀번호는 6자 이상이어야 합니다.';
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials': return '이메일 또는 비밀번호가 올바르지 않습니다.';
      case 'auth/too-many-requests': return '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
      default: return `오류: ${error?.message || '알 수 없는 오류'}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (nickname.trim()) {
          await updateProfile(cred.user, { displayName: nickname.trim() });
        }
        alert('회원가입 성공! 🎉');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert('로그인 성공! 😊');
      }
      onClose();
    } catch (error) {
      alert(errToMsg(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <h2 id="auth-title">{mode === 'login' ? '로그인' : '회원가입'}</h2>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoFocus
              required
            />
          )}

          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: 84 }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              style={{
                position: 'absolute',
                right: 6,
                top: 6,
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: '#fff',
                color: '#333',
                fontFamily: 'Ownglyph_ParkDaHyun, Arial, sans-serif',
                cursor: 'pointer'
              }}
              aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보이기'}
              title={showPw ? '비밀번호 숨기기' : '비밀번호 보이기'}
            >
              {showPw ? '숨김' : '보기'}
            </button>
          </div>

          <div className="auth-buttons">
            <button type="submit" disabled={loading}>
              {loading ? '처리 중…' : (mode === 'login' ? '로그인' : '가입하기')}
            </button>
            <button type="button" onClick={onClose} disabled={loading}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;

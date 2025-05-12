// src/AuthModal.js
import React, { useState } from 'react';

const AuthModal = ({ mode, open, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="auth-modal">
        <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

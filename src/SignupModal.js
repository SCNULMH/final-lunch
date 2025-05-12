// src/SignupModal.js
import React, { useState } from 'react';

function SignupModal({ open, onClose, onSignup }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  if (!open) return null;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    // 실제 회원가입 로직은 이곳에서 처리
    onSignup(form);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>회원가입</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="이름"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit">회원가입</button>
          <button type="button" onClick={onClose} style={{ background: "#bbb", marginLeft: 8 }}>
            닫기
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignupModal;

import React, { useState } from 'react';

const MEMBER_COLORS = ['#4A90D9', '#0D9E75', '#E59C2D', '#9B59B6', '#E05A5A', '#2E9E5B', '#3498DB', '#E67E22'];

export default function MemberModal({ open, members, onClose, onAdd, onRemove }) {
  const [input, setInput] = useState('');

  if (!open) return null;

  const handleAdd = () => {
    const name = input.trim();
    if (!name) return;
    onAdd(name);
    setInput('');
  };

  return (
    <div className="overlay open" onClick={(e) => { if (e.target.classList.contains('overlay')) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>จัดการสมาชิกทีม</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="member-list">
            {members.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '12px' }}>ยังไม่มีสมาชิก</p>
            )}
            {members.map((m, i) => {
              const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
              return (
                <div className="member-item" key={m.id}>
                  <div className="avatar" style={{ background: color }}>{m.name.charAt(0)}</div>
                  <span className="member-name">{m.name}</span>
                  <button className="member-del" onClick={() => onRemove(m.id)}>×</button>
                </div>
              );
            })}
          </div>
          <div className="add-member-row">
            <input
              type="text" value={input} placeholder="ชื่อสมาชิกใหม่..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>+ เพิ่ม</button>
          </div>
        </div>
      </div>
    </div>
  );
}

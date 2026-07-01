import React, { useState, useEffect } from 'react';
import { parseDate } from '../lib/timeline';

const SUB_PILL_CLS = { 'รอ': 'p-wait', 'กำลังทำ': 'p-prog', 'เสร็จ': 'p-done' };

export default function TaskModal({ open, task, members, onClose, onSave, onDelete }) {
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [prio, setPrio] = useState('Medium');
  const [note, setNote] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [quickSub, setQuickSub] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    if (!open) return;
    if (task) {
      setName(task.name || '');
      setOwner(task.owner || '');
      setStart(task.start || '');
      setEnd(task.end || '');
      setPrio(task.prio || 'Medium');
      setNote(task.note || '');
      setSubtasks(
        (task.subtasks || []).map((s) => ({
          name: s.name,
          status: s.status,
          owner: s.owner || task.owner || '',
          start: s.start || task.start || '',
          due: s.due || task.end || '',
        }))
      );
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const endD = new Date(); endD.setDate(endD.getDate() + 6);
      setName(''); setOwner(''); setStart(today);
      setEnd(endD.toISOString().slice(0, 10));
      setPrio('Medium'); setNote(''); setSubtasks([]);
    }
    setQuickSub(''); setPasteMode(false); setPasteText('');
  }, [open, task?.id]);

  if (!open) return null;

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const updateSub = (i, patch) => {
    setSubtasks((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const removeSub = (i) => setSubtasks((prev) => prev.filter((_, idx) => idx !== i));

  const quickAdd = () => {
    const n = quickSub.trim();
    if (!n) return;
    setSubtasks((prev) => [...prev, { name: n, status: 'รอ', owner, start, due: end }]);
    setQuickSub('');
  };

  const applyPaste = () => {
    const lines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean);
    setSubtasks((prev) => [
      ...prev,
      ...lines.map((n) => ({ name: n, status: 'รอ', owner, start, due: end })),
    ]);
    setPasteText('');
    setPasteMode(false);
  };

  const handleSave = () => {
    if (!name.trim()) { alert('กรุณาระบุชื่องาน'); return; }
    onSave(task?.id || null, {
      name: name.trim(), owner, start, end, prio, note,
      subtasks: subtasks.filter((s) => s.name && s.name.trim()),
    });
  };

  return (
    <div className="overlay open" onClick={(e) => { if (e.target.classList.contains('overlay')) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{task ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>ชื่องาน</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="ระบุชื่องาน..." autoFocus />
          </div>
          <div className="form-group">
            <label>ผู้รับผิดชอบ</label>
            <select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">— เลือกสมาชิก —</option>
              {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>วันเริ่ม</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label>วันสิ้นสุด</label>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={prio} onChange={(e) => setPrio(e.target.value)}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="form-group">
            <label>หมายเหตุ</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." />
          </div>

          <div className="form-group">
            <label>Subtasks</label>
            <div className="subtask-list">
              {subtasks.length === 0 && (
                <p style={{ fontSize: '11px', color: 'var(--muted)', padding: '4px 2px' }}>
                  ยังไม่มี subtask — พิมพ์ด้านล่างแล้วกด Enter
                </p>
              )}
              {subtasks.map((s, i) => {
                const isLate = s.status !== 'เสร็จ' && s.due && parseDate(s.due) < today;
                return (
                  <div className={`subtask-item ${isLate ? 'is-late' : ''}`} key={i}>
                    <div className="subtask-row-top">
                      <span className="subtask-num">{i + 1}.</span>
                      <input
                        type="text" value={s.name} placeholder="ชื่อ subtask..."
                        onChange={(e) => updateSub(i, { name: e.target.value })}
                      />
                      <button className="subtask-del" onClick={() => removeSub(i)}>×</button>
                    </div>
                    <div className="subtask-row-bottom">
                      <span className="subtask-label">{s.name || 'subtask ใหม่'}</span>
                      <select
                        className={`status-select ${SUB_PILL_CLS[s.status]}`}
                        value={s.status}
                        onChange={(e) => updateSub(i, { status: e.target.value })}
                      >
                        <option value="รอ">○ รอ</option>
                        <option value="กำลังทำ">⟳ กำลังทำ</option>
                        <option value="เสร็จ">✓ เสร็จ</option>
                      </select>
                    </div>
                    <div className="subtask-row-meta">
                      <select className="sub-owner-select" value={s.owner} onChange={(e) => updateSub(i, { owner: e.target.value })}>
                        <option value="">— ผู้รับผิดชอบ —</option>
                        {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                      <input
                        type="date" className="sub-due-input" value={s.start || ''}
                        title="วันเริ่ม" placeholder="วันเริ่ม"
                        onChange={(e) => updateSub(i, { start: e.target.value })}
                      />
                      <span className="sub-date-sep">→</span>
                      <input
                        type="date" className="sub-due-input" value={s.due || ''}
                        title="วันสิ้นสุด" placeholder="วันสิ้นสุด"
                        onChange={(e) => updateSub(i, { due: e.target.value })}
                      />
                      {isLate && (
                        <span className="late-tag">⚠ ล่าช้า{s.owner ? ' — ' + s.owner : ''}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="quick-add-row">
              <input
                type="text" value={quickSub} placeholder="พิมพ์ชื่อ subtask แล้วกด Enter..."
                onChange={(e) => setQuickSub(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); quickAdd(); } }}
              />
              <button className="btn btn-outline btn-sm" type="button" onClick={quickAdd}>+ เพิ่ม</button>
            </div>

            <button className="paste-toggle-btn" type="button" onClick={() => setPasteMode((v) => !v)}>
              📋 วางหลายรายการพร้อมกัน
            </button>
            {pasteMode && (
              <div id="pasteArea">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={'พิมพ์หรือวางรายการ subtask บรรทัดละ 1 รายการ เช่น\nร่างประกาศ JD\nโพสต์ JobsDB\nรวบรวม Resume'}
                />
                <button className="btn btn-primary btn-sm" type="button" onClick={applyPaste} style={{ marginTop: 6 }}>
                  เพิ่มทั้งหมด
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          {task && (
            <button className="btn btn-danger btn-sm" style={{ marginRight: 'auto' }} onClick={() => onDelete(task.id)}>
              ลบงาน
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

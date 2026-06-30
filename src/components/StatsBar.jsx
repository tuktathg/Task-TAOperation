import React from 'react';
import { getTaskStatus } from '../lib/timeline';

export default function StatsBar({ tasks }) {
  const counts = { done: 0, inprogress: 0, wait: 0, late: 0 };
  tasks.forEach((t) => counts[getTaskStatus(t)]++);
  const total = tasks.length;
  const pctTotal = total ? Math.round((counts.done / total) * 100) : 0;

  return (
    <div className="stats">
      <div className="stat-card">
        <div><div className="stat-val">{total}</div><div className="stat-lbl">งานทั้งหมด</div></div>
      </div>
      <div className="stat-card">
        <div className="stat-dot" style={{ background: '#2E9E5B' }} />
        <div><div className="stat-val" style={{ color: '#2E9E5B' }}>{counts.done}</div><div className="stat-lbl">เสร็จแล้ว</div></div>
      </div>
      <div className="stat-card">
        <div className="stat-dot" style={{ background: '#4A90D9' }} />
        <div><div className="stat-val" style={{ color: '#4A90D9' }}>{counts.inprogress}</div><div className="stat-lbl">กำลังดำเนินการ</div></div>
      </div>
      <div className="stat-card">
        <div className="stat-dot" style={{ background: '#8A6200' }} />
        <div><div className="stat-val" style={{ color: '#8A6200' }}>{counts.wait}</div><div className="stat-lbl">รอดำเนินการ</div></div>
      </div>
      <div className="stat-card">
        <div className="stat-dot" style={{ background: '#D94A4A' }} />
        <div><div className="stat-val" style={{ color: '#D94A4A' }}>{counts.late}</div><div className="stat-lbl">ล่าช้า</div></div>
      </div>
      <div className="stat-card">
        <div><div className="stat-val" style={{ color: '#0D9E75' }}>{pctTotal}%</div><div className="stat-lbl">% สำเร็จรวม</div></div>
      </div>
    </div>
  );
}

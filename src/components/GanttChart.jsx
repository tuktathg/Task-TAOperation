import React from 'react';
import {
  getTaskStatus, getLateOwners, getPct, STATUS_LABEL, STATUS_CLS,
  parseDate, buildWeeks, getWeekNumber, weekBarGeometry,
} from '../lib/timeline';

const SUB_CLS   = { 'เสร็จ':'s-sub-done', 'กำลังทำ':'s-sub-prog', 'รอ':'s-sub-wait' };
const SUB_LABEL = { 'เสร็จ':'✓ เสร็จ', 'กำลังทำ':'⟳ กำลังทำ', 'รอ':'○ รอ' };

export default function GanttChart({ tasks, onEditTask }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weeks = buildWeeks(tasks, new Date());

  // month header grouping
  const monthCols = [];
  let mCur = null, mSpan = 0, mLabel = '';
  weeks.forEach((w, i) => {
    const m = w.mon.getMonth();
    if (m !== mCur) {
      if (mCur !== null) monthCols.push({ span: mSpan, label: mLabel });
      mCur = m; mSpan = 1;
      mLabel = w.mon.toLocaleDateString('th-TH', { month: 'long', year: '2-digit' });
    } else mSpan++;
    if (i === weeks.length - 1) monthCols.push({ span: mSpan, label: mLabel });
  });

  if (!tasks.length) {
    return (
      <div className="gantt-wrap">
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div>ยังไม่มีงาน — กดปุ่ม "เพิ่มงาน" ด้านบน</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gantt-wrap">
      <div className="gantt-container">
        <table className="gantt-table">
          <thead>
            <tr className="month-header">
              <th className="col-name" style={{ textAlign: 'left', padding: '6px 12px' }}>ชื่องาน / Task</th>
              <th className="col-prio">Priority</th>
              <th className="col-owner">ผู้รับผิดชอบ</th>
              <th className="col-status">สถานะ</th>
              <th className="col-pct">คืบหน้า</th>
              {monthCols.map((mc, i) => (
                <th key={i} colSpan={mc.span} style={{ textAlign: 'center', letterSpacing: '.3px' }}>
                  {mc.label}
                </th>
              ))}
            </tr>
            <tr>
              <th className="col-name"></th>
              <th className="col-prio"></th>
              <th className="col-owner"></th>
              <th className="col-status"></th>
              <th className="col-pct"></th>
              {weeks.map((w, i) => {
                const hasToday = today >= w.mon && today <= w.sun;
                const wNum = getWeekNumber(w.mon);
                const label = `W${wNum} ${w.mon.getDate()}-${w.sun.getDate()}`;
                return (
                  <th key={i} className={`day-th col-week${hasToday ? ' is-today' : ''}`}>
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const status = getTaskStatus(task);
              const pct = getPct(task);
              const tStart = parseDate(task.start);
              const tEnd = parseDate(task.end);
              const lateOwners = status === 'late' ? getLateOwners(task) : [];

              return (
                <React.Fragment key={task.id}>
                  <tr className="task-row">
                    <td>
                      <div className="cell-name" onClick={() => onEditTask(task.id)}>
                        <span className="task-icon">▸</span>{task.name}
                      </div>
                    </td>
                    <td className="cell-prio">
                      <span className={`prio-badge prio-${(task.prio || 'Medium').toLowerCase()}`}>
                        {task.prio || 'Medium'}
                      </span>
                    </td>
                    <td className="cell-owner">{task.owner || '—'}</td>
                    <td className="cell-status">
                      <span className={`status-badge ${STATUS_CLS[status]}`}>{STATUS_LABEL[status]}</span>
                      {lateOwners.length > 0 && (
                        <div className="late-owner-tag">⚠ {lateOwners.join(', ')}</div>
                      )}
                    </td>
                    <td className="cell-pct">
                      <div className="pct-wrap">
                        <div className="pct-bar-bg"><div className="pct-bar-fill" style={{ width: `${pct}%` }} /></div>
                        <span className="pct-label">{pct}%</span>
                      </div>
                    </td>
                    {weeks.map((w, i) => {
                      const hasToday = today >= w.mon && today <= w.sun;
                      const cellCls = 'week-cell' + (hasToday ? ' has-today' : '');
                      const geo = weekBarGeometry(w, tStart, tEnd, pct);
                      return (
                        <td key={i} className={cellCls}>
                          <div className="week-bar-wrap">
                            {geo && (
                              <>
                                <div className="week-bar" style={{ left: `${geo.leftPct.toFixed(1)}%`, width: `${geo.widthPct.toFixed(1)}%` }} />
                                {geo.doneWidth > 0 && (
                                  <div className="week-bar done-layer" style={{ left: `${geo.leftPct.toFixed(1)}%`, width: `${geo.doneWidth.toFixed(1)}%` }} />
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {(task.subtasks || []).map((sub, si) => {
                    const subOwner = sub.owner || task.owner || '—';
                    const subIsLate = sub.status !== 'เสร็จ' && sub.due && parseDate(sub.due) < today;
                    const subStart = parseDate(sub.start) || tStart;
                    const subEnd = parseDate(sub.due) || tEnd;
                    const subPct = sub.status === 'เสร็จ' ? 100 : 0;
                    return (
                      <tr key={si} className={`task-row subtask-row${subIsLate ? ' sub-late' : ''}`}>
                        <td><div className="cell-name sub"><span className="sub-arrow">↳</span>{sub.name}</div></td>
                        <td className="cell-prio"></td>
                        <td className="cell-owner" style={{ fontSize: '10px' }}>{subOwner}{subIsLate ? ' ⚠' : ''}</td>
                        <td className="cell-status">
                          <span className={`status-badge ${SUB_CLS[sub.status] || 's-sub-wait'}`} style={{ fontSize: '9px' }}>
                            {SUB_LABEL[sub.status] || sub.status}
                          </span>
                        </td>
                        <td></td>
                        {weeks.map((w, i) => {
                          const hasToday = today >= w.mon && today <= w.sun;
                          const cellCls = 'week-cell' + (hasToday ? ' has-today' : '');
                          const geo = weekBarGeometry(w, subStart, subEnd, subPct);
                          return (
                            <td key={i} className={cellCls}>
                              <div className="week-bar-wrap">
                                {geo && <div className={`week-bar sub-bar${subIsLate ? ' sub-bar-late' : ''}`} style={{ left: `${geo.leftPct.toFixed(1)}%`, width: `${geo.widthPct.toFixed(1)}%` }} />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

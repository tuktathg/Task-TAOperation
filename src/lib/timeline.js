// ── Status / progress logic ─────────────────────────────────────────
export function getTaskStatus(task) {
  const subs = task.subtasks || [];
  if (!subs.length) return 'wait';
  const total = subs.length;
  const done = subs.filter((s) => s.status === 'เสร็จ').length;
  const inprog = subs.filter((s) => s.status === 'กำลังทำ').length;
  if (done === total) return 'done';

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const taskEndLate = task.end && parseDate(task.end) < today;
  const subLate = subs.some(
    (s) => s.status !== 'เสร็จ' && s.due && parseDate(s.due) < today
  );
  if (taskEndLate || subLate) return 'late';

  if (inprog > 0 || done > 0) return 'inprogress';
  return 'wait';
}

export function getLateOwners(task) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const subs = task.subtasks || [];
  const lateOwners = subs
    .filter((s) => s.status !== 'เสร็จ' && s.due && parseDate(s.due) < today)
    .map((s) => s.owner || task.owner)
    .filter(Boolean);
  return [...new Set(lateOwners)];
}

export function getPct(task) {
  const subs = task.subtasks || [];
  if (!subs.length) return 0;
  return Math.round(
    (subs.filter((s) => s.status === 'เสร็จ').length / subs.length) * 100
  );
}

export const STATUS_LABEL = {
  done: 'เสร็จแล้ว',
  inprogress: 'กำลังดำเนินการ',
  wait: 'รอดำเนินการ',
  late: 'ล่าช้า',
};
export const STATUS_CLS = {
  done: 's-done',
  inprogress: 's-inprog',
  wait: 's-wait',
  late: 's-late',
};

// ── Date helpers ─────────────────────────────────────────────────────
export function parseDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
export function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── Week helpers ─────────────────────────────────────────────────────
export function weekStart(d) {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}
export function weekEnd(ws) {
  const r = new Date(ws);
  r.setDate(r.getDate() + 6);
  return r;
}
export function getWeekNumber(d) {
  const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  const offset = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
  return Math.ceil((d.getDate() + offset) / 7);
}

// Build the array of weeks spanning all tasks (+ buffer)
export function buildWeeks(tasks, todayParam) {
  const today = todayParam || new Date();
  today.setHours(0, 0, 0, 0);

  let minDate = new Date(today);
  let maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 42);

  tasks.forEach((t) => {
    if (t.start) {
      const d = parseDate(t.start);
      if (d && d < minDate) minDate = new Date(d);
    }
    if (t.end) {
      const d = parseDate(t.end);
      if (d && d > maxDate) maxDate = new Date(d);
    }
  });

  let wMin = weekStart(minDate);
  wMin.setDate(wMin.getDate() - 7);
  let wMax = weekStart(maxDate);
  wMax.setDate(wMax.getDate() + 14);

  const weeks = [];
  let cur = new Date(wMin);
  while (cur <= wMax) {
    const mon = new Date(cur);
    const sun = weekEnd(mon);
    weeks.push({ mon, sun });
    cur.setDate(cur.getDate() + 7);
  }
  return weeks;
}

// Compute bar position/width (%) within a week cell, plus done-overlay width
export function weekBarGeometry(week, tStart, tEnd, pctDone) {
  const { mon, sun } = week;
  if (!tStart || !tEnd || tEnd < mon || tStart > sun) return null;

  const overlapStart = tStart > mon ? tStart : mon;
  const overlapEnd = tEnd < sun ? tEnd : sun;
  const wDur = 7;

  const leftPct = (Math.max(0, (overlapStart - mon) / 86400000) / wDur) * 100;
  const widthPct = Math.min(
    100 - leftPct,
    ((overlapEnd - overlapStart) / 86400000 + 1) / wDur * 100
  );

  const totalDur = (tEnd - tStart) / 86400000 + 1;
  const doneEnd =
    totalDur > 0
      ? new Date(tStart.getTime() + (pctDone / 100) * totalDur * 86400000)
      : null;

  let doneWidth = 0;
  if (doneEnd && doneEnd > mon) {
    const doneOverlapEnd = doneEnd < sun ? doneEnd : sun;
    const doneOverlapStart = overlapStart;
    if (doneOverlapEnd > doneOverlapStart) {
      doneWidth = ((doneOverlapEnd - doneOverlapStart) / 86400000 / wDur) * 100;
      doneWidth = Math.min(doneWidth, widthPct);
    }
  }

  return { leftPct, widthPct, doneWidth };
}

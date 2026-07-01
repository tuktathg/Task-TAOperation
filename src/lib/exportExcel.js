import * as XLSX from 'xlsx';

export function exportToExcel(tasks) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Tasks summary ──────────────────────────────────────
  const taskRows = tasks.map((t) => {
    const total = t.subtasks.length;
    const done = t.subtasks.filter((s) => s.status === 'เสร็จ').length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return {
      'ชื่องาน': t.name,
      'ผู้รับผิดชอบ': t.owner || '',
      'วันเริ่ม': t.start || '',
      'วันสิ้นสุด': t.end || '',
      'Priority': t.prio || '',
      '% คืบหน้า': pct,
      'จำนวน Subtask': total,
      'หมายเหตุ': t.note || '',
    };
  });
  const wsTasks = XLSX.utils.json_to_sheet(taskRows);
  wsTasks['!cols'] = [
    { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');

  // ── Sheet 2: Subtasks detail ────────────────────────────────────
  const subRows = [];
  tasks.forEach((t) => {
    (t.subtasks || []).forEach((s) => {
      subRows.push({
        'งานหลัก': t.name,
        'Subtask': s.name,
        'ผู้รับผิดชอบ': s.owner || t.owner || '',
        'สถานะ': s.status,
        'วันเริ่ม': s.start || '',
        'วันกำหนดจบ': s.due || '',
        'ล่าช้า?': s.status !== 'เสร็จ' && s.due && new Date(s.due) < new Date()
          ? 'ใช่' : '',
      });
    });
  });
  const wsSubs = XLSX.utils.json_to_sheet(subRows);
  wsSubs['!cols'] = [
    { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSubs, 'Subtasks');

  const filename = `team_timeline_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

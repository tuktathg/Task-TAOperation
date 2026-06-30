import React, { useState, useMemo } from 'react';
import { useTasks, useMembers } from './lib/dataHooks';
import { getTaskStatus } from './lib/timeline';
import { exportToExcel } from './lib/exportExcel';
import StatsBar from './components/StatsBar';
import GanttChart from './components/GanttChart';
import TaskModal from './components/TaskModal';
import MemberModal from './components/MemberModal';

const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'done', label: 'เสร็จแล้ว' },
  { key: 'inprogress', label: 'กำลังดำเนินการ' },
  { key: 'wait', label: 'รอดำเนินการ' },
  { key: 'late', label: 'ล่าช้า' },
];

export default function App() {
  const configMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  const { tasks, loading: tasksLoading, saveTask, deleteTask } = useTasks();
  const { members, loading: membersLoading, addMember, removeMember } = useMembers();

  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (statusFilter !== 'all') list = list.filter((t) => getTaskStatus(t) === statusFilter);
    if (ownerFilter !== 'all') list = list.filter((t) => t.owner === ownerFilter);
    return list;
  }, [tasks, statusFilter, ownerFilter]);

  const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;

  const openAddTask = () => { setEditingTaskId(null); setTaskModalOpen(true); };
  const openEditTask = (id) => { setEditingTaskId(id); setTaskModalOpen(true); };
  const closeTaskModal = () => { setTaskModalOpen(false); setEditingTaskId(null); };

  const handleSaveTask = async (id, data) => {
    try {
      await saveTask(id, data);
      closeTaskModal();
      showToast(id ? 'อัปเดตงานแล้ว ✓' : 'เพิ่มงานใหม่แล้ว ✓');
    } catch (e) {
      console.error(e);
      showToast('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('ยืนยันลบงานนี้?')) return;
    try {
      await deleteTask(id);
      closeTaskModal();
      showToast('ลบงานแล้ว');
    } catch (e) {
      showToast('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  const handleAddMember = async (name) => {
    try { await addMember(name); showToast('เพิ่มสมาชิกแล้ว ✓'); }
    catch (e) { showToast('เกิดข้อผิดพลาด: ' + e.message); }
  };
  const handleRemoveMember = async (id) => {
    try { await removeMember(id); }
    catch (e) { showToast('เกิดข้อผิดพลาด: ' + e.message); }
  };

  if (configMissing) {
    return (
      <div className="config-error">
        <h2>⚠ ยังไม่ได้ตั้งค่า Supabase</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          สร้างไฟล์ <code>.env.local</code> ที่ root ของโปรเจกต์ แล้วใส่:
        </p>
        <code>{`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`}</code>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          ดูวิธีหาค่านี้ได้ใน README.md
        </p>
      </div>
    );
  }

  if (tasksLoading || membersLoading) {
    return <div className="loading-screen">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <>
      <header className="header">
        <div className="header-left">
          <h1> Team Timeline Planner</h1>
          <span className="header-tag"><span className="sync-dot"></span>Real-time</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => exportToExcel(tasks)}> Export Excel</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setMemberModalOpen(true)}> สมาชิก</button>
          <button className="btn btn-primary btn-sm" onClick={openAddTask}>+ เพิ่มงาน</button>
        </div>
      </header>

      <div className="main">
        <StatsBar tasks={tasks} />

        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`pill ${statusFilter === f.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          <select
            className="owner-filter-select"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
          >
            <option value="all">ผู้รับผิดชอบ: ทั้งหมด</option>
            {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>

        <p className="section-title">Timeline</p>
        <GanttChart tasks={filteredTasks} onEditTask={openEditTask} />
      </div>

      <TaskModal
        open={taskModalOpen}
        task={editingTask}
        members={members}
        onClose={closeTaskModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
      <MemberModal
        open={memberModalOpen}
        members={members}
        onClose={() => setMemberModalOpen(false)}
        onAdd={handleAddMember}
        onRemove={handleRemoveMember}
      />

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  );
}

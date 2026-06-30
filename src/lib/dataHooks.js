import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

// ── Members ─────────────────────────────────────────────────────────
export function useMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error) setMembers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  const addMember = async (name) => {
    const { error } = await supabase.from('members').insert({ name });
    if (error) throw error;
  };

  const removeMember = async (id) => {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) throw error;
  };

  return { members, loading, addMember, removeMember, reload: load };
}

// ── Tasks + Subtasks ────────────────────────────────────────────────
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: taskRows, error: taskErr } = await supabase
      .from('tasks')
      .select('*')
      .order('start_date', { ascending: true });

    if (taskErr) { console.error(taskErr); setLoading(false); return; }

    const { data: subRows, error: subErr } = await supabase
      .from('subtasks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (subErr) { console.error(subErr); setLoading(false); return; }

    const merged = (taskRows || []).map((t) => ({
      id: t.id,
      name: t.name,
      owner: t.owner,
      start: t.start_date,
      end: t.end_date,
      prio: t.priority,
      note: t.note,
      subtasks: (subRows || [])
        .filter((s) => s.task_id === t.id)
        .map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
          owner: s.owner,
          due: s.due_date,
        })),
    }));

    setTasks(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  // Create or update a task + replace its subtasks
  const saveTask = async (taskId, taskData) => {
    const payload = {
      name: taskData.name,
      owner: taskData.owner || null,
      start_date: taskData.start || null,
      end_date: taskData.end || null,
      priority: taskData.prio || 'Medium',
      note: taskData.note || '',
    };

    let savedTaskId = taskId;

    if (taskId) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', taskId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('tasks').insert(payload).select().single();
      if (error) throw error;
      savedTaskId = data.id;
    }

    // Replace subtasks: delete existing, insert fresh
    // (simplest consistent approach for a small team tool)
    if (taskId) {
      const { error: delErr } = await supabase.from('subtasks').delete().eq('task_id', taskId);
      if (delErr) throw delErr;
    }

    const subPayload = (taskData.subtasks || [])
      .filter((s) => s.name && s.name.trim())
      .map((s, i) => ({
        task_id: savedTaskId,
        name: s.name,
        status: s.status || 'รอ',
        owner: s.owner || null,
        due_date: s.due || null,
        sort_order: i,
      }));

    if (subPayload.length) {
      const { error: subErr } = await supabase.from('subtasks').insert(subPayload);
      if (subErr) throw subErr;
    }
  };

  const deleteTask = async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  };

  return { tasks, loading, saveTask, deleteTask, reload: load };
}

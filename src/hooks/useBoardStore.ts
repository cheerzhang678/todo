import { useState, useCallback, useEffect, useRef } from 'react';
import type { Todo, Priority, Category, Recurrence, ViewMode, StatusFilter, CatFilter } from '../types';
import { supabase } from '../lib/supabase';
import { todoFromRow, todoToRow } from '../lib/supabase-types';
import type { TodoRow } from '../lib/supabase-types';
import type { TodoStore } from './useTodoStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type SyncStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

// Reuse the same visibility logic as useTodoStore
function todoVisibleOnDate(t: Todo, dateStr: string): boolean {
  if (t.recurrence === 'weekly') {
    if (dateStr < t.date) return false;
    if (t.endDate && dateStr > t.endDate) return false;
    const startDay = new Date(t.date + 'T00:00:00').getDay();
    const checkDay = new Date(dateStr + 'T00:00:00').getDay();
    return startDay === checkDay;
  }
  if (!t.endDate) return t.date === dateStr;
  return dateStr >= t.date && dateStr <= t.endDate;
}

export function useBoardStore(boardId: string): TodoStore & { syncStatus: SyncStatus; onlineCount: number; syncError: string | null } {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewAnchor, setViewAnchor] = useState(new Date());
  const [catFilter, setCatFilter] = useState<CatFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [onlineCount, setOnlineCount] = useState(1);
  const [syncError, setSyncError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Show error briefly then clear
  const showError = useCallback((msg: string) => {
    setSyncError(msg);
    setTimeout(() => setSyncError(null), 5000);
  }, []);

  // Initial fetch + realtime subscription
  useEffect(() => {
    let mounted = true;

    async function init() {
      setSyncStatus('connecting');
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('board_id', boardId)
        .order('id', { ascending: false });

      if (!mounted) return;
      if (error) {
        setSyncStatus('error');
        showError('无法加载看板数据');
        return;
      }
      setTodos((data as TodoRow[]).map(todoFromRow));
      setSyncStatus('connected');
    }

    init();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`board:${boardId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'todos',
        filter: `board_id=eq.${boardId}`,
      }, (payload) => {
        if (!mounted) return;
        const newTodo = todoFromRow(payload.new as TodoRow);
        setTodos(prev => {
          if (prev.some(t => t.id === newTodo.id)) return prev;
          return [newTodo, ...prev];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'todos',
        filter: `board_id=eq.${boardId}`,
      }, (payload) => {
        if (!mounted) return;
        const updated = todoFromRow(payload.new as TodoRow);
        setTodos(prev => prev.map(t => t.id === updated.id ? updated : t));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'todos',
        filter: `board_id=eq.${boardId}`,
      }, (payload) => {
        if (!mounted) return;
        const oldId = (payload.old as { id: number }).id;
        setTodos(prev => prev.filter(t => t.id !== oldId));
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (!mounted) return;
        if (status === 'SUBSCRIBED') {
          channel.track({ online_at: new Date().toISOString() });
          setSyncStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setSyncStatus('reconnecting');
        }
      });

    channelRef.current = channel;

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [boardId, showError]);

  // Helper: write to supabase, rollback on error
  const writeToSupabase = useCallback(async (
    operation: () => PromiseLike<{ error: { message: string } | null }>,
    rollbackTodos: Todo[],
  ) => {
    const { error } = await operation();
    if (error) {
      setTodos(rollbackTodos);
      showError('同步失败，已回滚');
    }
  }, [showError]);

  const addTodo = useCallback((text: string, date: string, endDate: string, priority: Priority, category: Category, recurrence: Recurrence = 'none') => {
    const todo: Todo = {
      id: Date.now(), text, done: false, priority, category,
      date, endDate: endDate && endDate > date ? endDate : undefined,
      progress: 0, dailyProgress: {}, recurrence,
    };
    const prev = todos;
    setTodos([todo, ...todos]);
    writeToSupabase(
      () => supabase.from('todos').insert(todoToRow(todo, boardId)),
      prev,
    );
  }, [todos, boardId, writeToSupabase]);

  const toggleTodo = useCallback((id: number) => {
    const prev = todos;
    const target = todos.find(t => t.id === id);
    if (!target) return;
    const newDone = !target.done;
    const newProgress = newDone ? 100 : target.progress;
    setTodos(todos.map(t => t.id === id ? { ...t, done: newDone, progress: newProgress } : t));
    writeToSupabase(
      () => supabase.from('todos').update({ done: newDone, progress: newProgress }).eq('id', id).eq('board_id', boardId),
      prev,
    );
  }, [todos, boardId, writeToSupabase]);

  const deleteTodo = useCallback((id: number) => {
    const prev = todos;
    setTodos(todos.filter(t => t.id !== id));
    writeToSupabase(
      () => supabase.from('todos').delete().eq('id', id).eq('board_id', boardId),
      prev,
    );
  }, [todos, boardId, writeToSupabase]);

  const editTodo = useCallback((id: number, text: string) => {
    const prev = todos;
    setTodos(todos.map(t => t.id === id ? { ...t, text } : t));
    writeToSupabase(
      () => supabase.from('todos').update({ text }).eq('id', id).eq('board_id', boardId),
      prev,
    );
  }, [todos, boardId, writeToSupabase]);

  const updateCategory = useCallback((id: number, category: Category) => {
    const prev = todos;
    setTodos(todos.map(t => t.id === id ? { ...t, category } : t));
    writeToSupabase(
      () => supabase.from('todos').update({ category }).eq('id', id).eq('board_id', boardId),
      prev,
    );
  }, [todos, boardId, writeToSupabase]);

  const updatePriority = useCallback((id: number, priority: Priority) => {
    const prev = todos;
    setTodos(todos.map(t => t.id === id ? { ...t, priority } : t));
    writeToSupabase(
      () => supabase.from('todos').update({ priority }).eq('id', id).eq('board_id', boardId),
      prev,
    );
  }, [todos, boardId, writeToSupabase]);

  const updateDates = useCallback((id: number, date: string, endDate?: string) => {
    const prev = todos;
    const cleanEnd = endDate && endDate > date ? endDate : undefined;
    setTodos(todos.map(t => t.id === id ? { ...t, date, endDate: cleanEnd } : t));
    writeToSupabase(
      () => supabase.from('todos').update({ date, end_date: cleanEnd || null }).eq('id', id).eq('board_id', boardId),
      prev,
    );
  }, [todos, boardId, writeToSupabase]);

  const updateRecurrence = useCallback((id: number, recurrence: Recurrence) => {
    const prev = todos;
    setTodos(todos.map(t => t.id === id ? { ...t, recurrence } : t));
    writeToSupabase(
      () => supabase.from('todos').update({ recurrence }).eq('id', id).eq('board_id', boardId),
      prev,
    );
  }, [todos, boardId, writeToSupabase]);

  const updateProgress = useCallback((id: number, progress: number, dateStr: string) => {
    const prev = todos;
    setTodos(todos.map(t => {
      if (t.id !== id) return t;
      const dp = { ...t.dailyProgress, [dateStr]: progress };
      return { ...t, progress, done: progress >= 100, dailyProgress: dp };
    }));
    const target = todos.find(t => t.id === id);
    if (!target) return;
    const dp = { ...target.dailyProgress, [dateStr]: progress };
    writeToSupabase(
      () => supabase.from('todos').update({
        progress,
        done: progress >= 100,
        daily_progress: dp,
      }).eq('id', id).eq('board_id', boardId),
      prev,
    );
  }, [todos, boardId, writeToSupabase]);

  const clearDone = useCallback((dateStr: string) => {
    const prev = todos;
    const toDelete = todos.filter(t => t.done && todoVisibleOnDate(t, dateStr));
    if (toDelete.length === 0) return;
    setTodos(todos.filter(t => !(t.done && todoVisibleOnDate(t, dateStr))));
    // Delete each done todo from supabase
    const ids = toDelete.map(t => t.id);
    writeToSupabase(
      () => supabase.from('todos').delete().in('id', ids).eq('board_id', boardId),
      prev,
    );
  }, [todos, boardId, writeToSupabase]);

  // Query functions (same logic as useTodoStore)
  const filtered = useCallback((list: Todo[]) => {
    return list.filter(t => {
      if (catFilter !== 'all' && t.category !== catFilter) return false;
      if (statusFilter === 'active' && t.done) return false;
      if (statusFilter === 'done' && !t.done) return false;
      return true;
    });
  }, [catFilter, statusFilter]);

  const byDate = useCallback((dateStr: string) => {
    return todos.filter(t => todoVisibleOnDate(t, dateStr));
  }, [todos]);

  const byMonth = useCallback((y: number, m: number) => {
    const prefix = `${y}-${String(m + 1).padStart(2, '0')}`;
    return todos.filter(t => {
      if (t.recurrence === 'weekly') {
        const monthStart = `${prefix}-01`;
        const monthEnd = `${prefix}-31`;
        if (t.date > monthEnd) return false;
        if (t.endDate && t.endDate < monthStart) return false;
        return true;
      }
      if (!t.endDate) return t.date.startsWith(prefix);
      const monthStart = `${prefix}-01`;
      const monthEnd = `${prefix}-31`;
      return t.date <= monthEnd && t.endDate >= monthStart;
    });
  }, [todos]);

  const byYear = useCallback((y: number) => {
    const yStr = String(y);
    return todos.filter(t => {
      if (t.recurrence === 'weekly') {
        if (t.date.slice(0, 4) > yStr) return false;
        if (t.endDate && t.endDate.slice(0, 4) < yStr) return false;
        return true;
      }
      if (!t.endDate) return t.date.startsWith(yStr);
      return t.date.slice(0, 4) <= yStr && t.endDate.slice(0, 4) >= yStr;
    });
  }, [todos]);

  const getProgressForDate = useCallback((t: Todo, dateStr: string): number => {
    if (!t.dailyProgress) return t.progress;
    if (t.dailyProgress[dateStr] !== undefined) return t.dailyProgress[dateStr];
    const dates = Object.keys(t.dailyProgress).filter(d => d < dateStr).sort();
    if (dates.length > 0) return t.dailyProgress[dates[dates.length - 1]];
    return 0;
  }, []);

  return {
    todos, viewMode, selectedDate, viewAnchor, catFilter, statusFilter,
    setViewMode, setSelectedDate, setViewAnchor, setCatFilter, setStatusFilter,
    addTodo, toggleTodo, deleteTodo, editTodo, updateCategory, updatePriority,
    updateDates, updateRecurrence,
    updateProgress, clearDone, filtered, byDate, byMonth, byYear, getProgressForDate,
    syncStatus, onlineCount, syncError,
  };
}

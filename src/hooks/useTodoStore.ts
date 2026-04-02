import { useState, useCallback } from 'react';
import type { Todo, Priority, Category, Recurrence, ViewMode, StatusFilter, CatFilter } from '../types';
import { fmtDate } from '../utils';

const STORAGE_KEY = 'todos_v2';

function loadTodos(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    // Ensure progress field exists (migration for existing v2 data)
    const parsed = JSON.parse(raw) as Todo[];
    return parsed.map(t => ({
      ...t,
      progress: t.progress ?? (t.done ? 100 : 0),
      dailyProgress: t.dailyProgress ?? {},
      recurrence: t.recurrence ?? 'none',
    }));
  }
  // Migrate from old format
  const old = localStorage.getItem('todos');
  if (old) {
    const oldTodos = JSON.parse(old) as Array<Record<string, unknown>>;
    const migrated: Todo[] = oldTodos.map((t) => ({
      id: t.id as number,
      text: t.text as string,
      done: t.done as boolean,
      priority: t.priority === 'high' ? 'P0' : t.priority === 'low' ? 'P2' : 'P1',
      category: (t.category as Category) || 'work',
      date: (t.date as string) || fmtDate(new Date()),
      progress: (t.done as boolean) ? 100 : 0,
      dailyProgress: {},
      recurrence: 'none' as const,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  return [];
}

// Check if a todo is visible on a given date (single day, range, or weekly recurring)
function todoVisibleOnDate(t: Todo, dateStr: string): boolean {
  // Weekly recurring: show on the same weekday as the start date, on or after start date
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

export function useTodoStore() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewAnchor, setViewAnchor] = useState(new Date());
  const [catFilter, setCatFilter] = useState<CatFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const save = useCallback((next: Todo[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setTodos(next);
  }, []);

  const addTodo = useCallback((text: string, date: string, endDate: string, priority: Priority, category: Category, recurrence: Recurrence = 'none') => {
    const todo: Todo = {
      id: Date.now(), text, done: false, priority, category,
      date, endDate: endDate && endDate > date ? endDate : undefined,
      progress: 0, dailyProgress: {}, recurrence,
    };
    save([todo, ...todos]);
  }, [todos, save]);

  const toggleTodo = useCallback((id: number) => {
    save(todos.map(t => {
      if (t.id !== id) return t;
      const newDone = !t.done;
      return { ...t, done: newDone, progress: newDone ? 100 : t.progress };
    }));
  }, [todos, save]);

  const deleteTodo = useCallback((id: number) => {
    save(todos.filter(t => t.id !== id));
  }, [todos, save]);

  const editTodo = useCallback((id: number, text: string) => {
    save(todos.map(t => t.id === id ? { ...t, text } : t));
  }, [todos, save]);

  const updateCategory = useCallback((id: number, category: Category) => {
    save(todos.map(t => t.id === id ? { ...t, category } : t));
  }, [todos, save]);

  const updatePriority = useCallback((id: number, priority: Priority) => {
    save(todos.map(t => t.id === id ? { ...t, priority } : t));
  }, [todos, save]);

  const updateDates = useCallback((id: number, date: string, endDate?: string) => {
    save(todos.map(t => t.id === id ? { ...t, date, endDate: endDate && endDate > date ? endDate : undefined } : t));
  }, [todos, save]);

  const updateRecurrence = useCallback((id: number, recurrence: Recurrence) => {
    save(todos.map(t => t.id === id ? { ...t, recurrence } : t));
  }, [todos, save]);

  const updateProgress = useCallback((id: number, progress: number, dateStr: string) => {
    save(todos.map(t => {
      if (t.id !== id) return t;
      const dp = { ...t.dailyProgress, [dateStr]: progress };
      return { ...t, progress, done: progress >= 100, dailyProgress: dp };
    }));
  }, [todos, save]);

  const clearDone = useCallback((dateStr: string) => {
    save(todos.filter(t => !(t.done && todoVisibleOnDate(t, dateStr))));
  }, [todos, save]);

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
        // Weekly task: check if any day in this month matches the weekday
        const monthStart = `${prefix}-01`;
        const monthEnd = `${prefix}-31`;
        if (t.date > monthEnd) return false;
        if (t.endDate && t.endDate < monthStart) return false;
        return true; // weekly task likely overlaps with this month
      }
      // single-day task: starts in this month
      if (!t.endDate) return t.date.startsWith(prefix);
      // range task: overlaps with this month
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

  // Get the effective progress for a todo on a specific date
  // (inherits from the latest previous day's progress if no record for that date)
  const getProgressForDate = useCallback((t: Todo, dateStr: string): number => {
    if (!t.dailyProgress) return t.progress;
    if (t.dailyProgress[dateStr] !== undefined) return t.dailyProgress[dateStr];
    // Find the latest entry before this date
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
  };
}

export type TodoStore = ReturnType<typeof useTodoStore>;

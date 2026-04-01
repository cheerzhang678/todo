import { useState, useCallback } from 'react';
import type { Todo, Priority, Category, ViewMode, StatusFilter, CatFilter } from '../types';
import { fmtDate } from '../utils';

const STORAGE_KEY = 'todos_v2';

function loadTodos(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
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
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  }
  return [];
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

  const addTodo = useCallback((text: string, date: string, priority: Priority, category: Category) => {
    const next: Todo[] = [{ id: Date.now(), text, done: false, priority, category, date }, ...todos];
    save(next);
  }, [todos, save]);

  const toggleTodo = useCallback((id: number) => {
    save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }, [todos, save]);

  const deleteTodo = useCallback((id: number) => {
    save(todos.filter(t => t.id !== id));
  }, [todos, save]);

  const editTodo = useCallback((id: number, text: string) => {
    save(todos.map(t => t.id === id ? { ...t, text } : t));
  }, [todos, save]);

  const clearDone = useCallback((dateStr: string) => {
    save(todos.filter(t => !(t.done && t.date === dateStr)));
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
    return todos.filter(t => t.date === dateStr);
  }, [todos]);

  const byMonth = useCallback((y: number, m: number) => {
    const prefix = `${y}-${String(m + 1).padStart(2, '0')}`;
    return todos.filter(t => t.date.startsWith(prefix));
  }, [todos]);

  const byYear = useCallback((y: number) => {
    return todos.filter(t => t.date.startsWith(String(y)));
  }, [todos]);

  return {
    todos, viewMode, selectedDate, viewAnchor, catFilter, statusFilter,
    setViewMode, setSelectedDate, setViewAnchor, setCatFilter, setStatusFilter,
    addTodo, toggleTodo, deleteTodo, editTodo, clearDone,
    filtered, byDate, byMonth, byYear,
  };
}

export type TodoStore = ReturnType<typeof useTodoStore>;

import type { Todo } from '../types';

export interface TodoRow {
  id: number;
  board_id: string;
  text: string;
  done: boolean;
  priority: string;
  category: string;
  date: string;
  end_date: string | null;
  progress: number;
  daily_progress: Record<string, number>;
  recurrence: string;
  created_at: string;
  updated_at: string;
}

export function todoFromRow(row: TodoRow): Todo {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    priority: row.priority as Todo['priority'],
    category: row.category as Todo['category'],
    date: row.date,
    endDate: row.end_date || undefined,
    progress: row.progress,
    dailyProgress: row.daily_progress || {},
    recurrence: (row.recurrence as Todo['recurrence']) || 'none',
  };
}

export function todoToRow(todo: Todo, boardId: string): Omit<TodoRow, 'created_at' | 'updated_at'> {
  return {
    id: todo.id,
    board_id: boardId,
    text: todo.text,
    done: todo.done,
    priority: todo.priority,
    category: todo.category,
    date: todo.date,
    end_date: todo.endDate || null,
    progress: todo.progress,
    daily_progress: todo.dailyProgress || {},
    recurrence: todo.recurrence || 'none',
  };
}

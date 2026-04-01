import { useState } from 'react';
import type { Todo, StatusFilter } from '../types';
import { fmtDate } from '../utils';

interface Props {
  selectedDate: Date;
  todos: Todo[];
  filteredTodos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, text: string) => void;
  onClearDone: (dateStr: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
}

const catLabels: Record<string, string> = { work: '工作', life: '生活' };
const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '未完成' },
  { key: 'done', label: '已完成' },
];

export default function TodoList({
  selectedDate, todos, filteredTodos, onToggle, onDelete, onEdit, onClearDone,
  statusFilter, onStatusChange,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const ds = fmtDate(selectedDate);
  const total = todos.length;
  const doneCount = todos.filter(t => t.done).length;
  const pct = total ? Math.round(doneCount / total * 100) : 0;

  return (
    <div className="card">
      <div className="todo-section-title">
        {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 待办事项
      </div>

      {/* Progress */}
      <div className="progress-wrap">
        <div className="progress-header">
          <span>完成进度 {doneCount}/{total}</span>
          <span>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Status filter */}
      <div className="filter-tabs">
        {statusOptions.map(s => (
          <button key={s.key} className={statusFilter === s.key ? 'active' : ''} onClick={() => onStatusChange(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stats-row">
        <span>共 {total} 项，{total - doneCount} 项未完成</span>
        <button className="clear-btn" onClick={() => onClearDone(ds)}>清除已完成</button>
      </div>

      {/* List */}
      <ul className="todo-list">
        {filteredTodos.map(t => (
          <li key={t.id} className={`todo-item${t.done ? ' done' : ''} border-${t.priority}`}>
            <div className="checkbox" onClick={() => onToggle(t.id)} />
            <span className={`priority-tag priority-${t.priority}`}>{t.priority}</span>
            <span className={`cat-tag cat-${t.category}`}>{catLabels[t.category] || t.category}</span>
            {editingId === t.id ? (
              <input
                className="edit-input"
                defaultValue={t.text}
                autoFocus
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v) onEdit(t.id, v);
                  setEditingId(null);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              />
            ) : (
              <span className="todo-text" onDoubleClick={() => setEditingId(t.id)}>{t.text}</span>
            )}
            <div className="actions">
              <button onClick={() => setEditingId(t.id)} title="编辑">&#9998;</button>
              <button onClick={() => onDelete(t.id)} title="删除">&#10005;</button>
            </div>
          </li>
        ))}
      </ul>
      {filteredTodos.length === 0 && <div className="empty">暂无待办事项</div>}
    </div>
  );
}

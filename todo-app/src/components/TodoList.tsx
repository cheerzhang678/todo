import { useState } from 'react';
import type { Todo, Priority, Category, StatusFilter } from '../types';
import { fmtDate } from '../utils';

interface Props {
  selectedDate: Date;
  todos: Todo[];
  filteredTodos: Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, text: string) => void;
  onCategoryChange: (id: number, category: Category) => void;
  onPriorityChange: (id: number, priority: Priority) => void;
  onProgressChange: (id: number, progress: number, dateStr: string) => void;
  getProgressForDate: (t: Todo, dateStr: string) => number;
  onClearDone: (dateStr: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
}

const catLabels: Record<string, string> = { work: '工作', life: '生活' };
const catOrder: Category[] = ['work', 'life'];
const priorityOrder: Priority[] = ['P0', 'P1', 'P2'];
const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '未完成' },
  { key: 'done', label: '已完成' },
];

export default function TodoList({
  selectedDate, todos, filteredTodos, onToggle, onDelete, onEdit,
  onCategoryChange, onPriorityChange, onProgressChange, getProgressForDate,
  onClearDone, statusFilter, onStatusChange,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const ds = fmtDate(selectedDate);
  const total = todos.length;
  const doneCount = todos.filter(t => t.done).length;
  const pct = total ? Math.round(doneCount / total * 100) : 0;

  const cycleCat = (t: Todo) => {
    const idx = catOrder.indexOf(t.category);
    onCategoryChange(t.id, catOrder[(idx + 1) % catOrder.length]);
  };

  const cyclePriority = (t: Todo) => {
    const idx = priorityOrder.indexOf(t.priority);
    onPriorityChange(t.id, priorityOrder[(idx + 1) % priorityOrder.length]);
  };

  return (
    <div className="card">
      <div className="todo-section-title">
        {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 待办事项
      </div>

      <div className="progress-wrap">
        <div className="progress-header">
          <span>完成进度 {doneCount}/{total}</span>
          <span>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="filter-tabs">
        {statusOptions.map(s => (
          <button key={s.key} className={statusFilter === s.key ? 'active' : ''} onClick={() => onStatusChange(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="stats-row">
        <span>共 {total} 项，{total - doneCount} 项未完成</span>
        <button className="clear-btn" onClick={() => onClearDone(ds)}>清除已完成</button>
      </div>

      <ul className="todo-list">
        {filteredTodos.map(t => {
          const itemProgress = getProgressForDate(t, ds);
          const isRange = !!t.endDate;
          return (
            <li key={t.id} className={`todo-item-wrap border-${t.priority}${t.done ? ' done' : ''}`}>
              <div className="todo-item-row">
                <div className="checkbox" onClick={() => onToggle(t.id)} />
                <span className={`priority-tag priority-${t.priority} clickable-tag`} onClick={() => cyclePriority(t)} title="点击切换优先级">
                  {t.priority}
                </span>
                <span className={`cat-tag cat-${t.category} clickable-tag`} onClick={() => cycleCat(t)} title="点击切换分类">
                  {catLabels[t.category] || t.category}
                </span>
                {editingId === t.id ? (
                  <input
                    className="edit-input"
                    defaultValue={t.text}
                    autoFocus
                    onBlur={(e) => { const v = e.target.value.trim(); if (v) onEdit(t.id, v); setEditingId(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                ) : (
                  <span className="todo-text" onDoubleClick={() => setEditingId(t.id)}>{t.text}</span>
                )}
                <div className="actions">
                  <button onClick={() => setEditingId(t.id)} title="编辑">&#9998;</button>
                  <button onClick={() => onDelete(t.id)} title="删除">&#10005;</button>
                </div>
              </div>
              {/* Date range & per-item progress */}
              <div className="item-meta">
                <span className="item-date-range">
                  {t.date.slice(5)}{isRange ? ` → ${t.endDate!.slice(5)}` : ''}
                </span>
                <div className="item-progress">
                  <div className="item-progress-bar">
                    <div className="item-progress-fill" style={{ width: `${itemProgress}%` }} />
                  </div>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={itemProgress}
                    className="item-progress-slider"
                    onChange={(e) => onProgressChange(t.id, Number(e.target.value), ds)}
                  />
                  <span className="item-progress-pct">{itemProgress}%</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {filteredTodos.length === 0 && <div className="empty">暂无待办事项</div>}
    </div>
  );
}

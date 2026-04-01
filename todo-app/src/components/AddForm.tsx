import { useState } from 'react';
import type { Priority, Category } from '../types';
import { fmtDate } from '../utils';

interface Props {
  selectedDate: Date;
  onAdd: (text: string, date: string, priority: Priority, category: Category) => void;
}

export default function AddForm({ selectedDate, onAdd }: Props) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(fmtDate(selectedDate));
  const [priority, setPriority] = useState<Priority>('P1');
  const [category, setCategory] = useState<Category>('work');

  // Sync date when selectedDate changes
  const dateStr = fmtDate(selectedDate);
  if (date !== dateStr && date === fmtDate(new Date())) {
    // Only auto-sync if user hasn't manually changed it
  }

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, date || dateStr, priority, category);
    setText('');
  };

  return (
    <div className="card">
      <div className="add-form">
        <input
          type="text"
          placeholder="输入新的待办事项..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
          <option value="P0">P0</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value as Category)}>
          <option value="work">工作</option>
          <option value="life">生活</option>
        </select>
        <button onClick={handleAdd}>添加</button>
      </div>
    </div>
  );
}

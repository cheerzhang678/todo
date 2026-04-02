import { useState } from 'react';
import type { Priority, Category, Recurrence } from '../types';
import { fmtDate } from '../utils';

interface Props {
  selectedDate: Date;
  onAdd: (text: string, date: string, endDate: string, priority: Priority, category: Category, recurrence: Recurrence) => void;
}

export default function AddForm({ selectedDate, onAdd }: Props) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(fmtDate(selectedDate));
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<Priority>('P1');
  const [category, setCategory] = useState<Category>('work');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');

  const dateStr = fmtDate(selectedDate);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, date || dateStr, endDate, priority, category, recurrence);
    setText('');
    setEndDate('');
    setRecurrence('none');
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
        <input type="date" value={date} onChange={e => setDate(e.target.value)} title="开始日期" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} title="结束日期（可选）" placeholder="结束日期" />
        <select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
          <option value="P0">P0</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value as Category)}>
          <option value="work">工作</option>
          <option value="life">生活</option>
        </select>
        <select value={recurrence} onChange={e => setRecurrence(e.target.value as Recurrence)} title="循环模式">
          <option value="none">不循环</option>
          <option value="weekly">每周循环</option>
        </select>
        <button onClick={handleAdd}>添加</button>
      </div>
    </div>
  );
}

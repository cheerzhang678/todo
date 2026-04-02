import type { Todo } from '../types';
import { WEEKDAYS, fmtDate, todayStr, weekStart } from '../utils';

interface Props {
  viewAnchor: Date;
  onSelectDay: (dateStr: string) => void;
  getFilteredByDate: (dateStr: string) => Todo[];
}

export default function WeekView({ viewAnchor, onSelectDay, getFilteredByDate }: Props) {
  const ws = weekStart(viewAnchor);
  const today = todayStr();

  const cols = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(ws);
    cur.setDate(ws.getDate() + i);
    const ds = fmtDate(cur);
    const isToday = ds === today;
    const dayTodos = getFilteredByDate(ds);

    cols.push(
      <div key={i} className="week-col" onClick={() => onSelectDay(ds)}>
        <div className={`wk-header${isToday ? ' today' : ''}`}>
          周{WEEKDAYS[i]}<br />
          <span className={`wk-date${isToday ? ' today' : ''}`}>{cur.getDate()}</span>
        </div>
        {dayTodos.slice(0, 4).map(t => (
          <div key={t.id} className={`wk-item p-${t.priority}${t.done ? ' done' : ''}`}>
            {t.text}
          </div>
        ))}
        {dayTodos.length > 4 && (
          <div style={{ fontSize: 10, color: '#8a9e95', textAlign: 'center' }}>+{dayTodos.length - 4}项</div>
        )}
      </div>
    );
  }

  return <div className="week-grid">{cols}</div>;
}

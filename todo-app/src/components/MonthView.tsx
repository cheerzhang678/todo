import type { Todo } from '../types';
import { WEEKDAYS, fmtDate, todayStr } from '../utils';

interface Props {
  viewAnchor: Date;
  selectedDate: Date;
  onSelectDay: (dateStr: string) => void;
  getFilteredByDate: (dateStr: string) => Todo[];
}

export default function MonthView({ viewAnchor, selectedDate, onSelectDay, getFilteredByDate }: Props) {
  const y = viewAnchor.getFullYear();
  const m = viewAnchor.getMonth();
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const today = todayStr();
  const selStr = fmtDate(selectedDate);

  const startDate = new Date(first);
  startDate.setDate(startDate.getDate() - startDay);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const cur = new Date(startDate);
    cur.setDate(startDate.getDate() + i);
    const ds = fmtDate(cur);
    const isOther = cur.getMonth() !== m;
    const isToday = ds === today;
    const isSel = ds === selStr;

    let cls = 'day-cell';
    if (isOther) cls += ' other';
    if (isToday) cls += ' today';
    if (isSel) cls += ' selected';

    const dayTodos = getFilteredByDate(ds);

    cells.push(
      <div key={i} className={cls} onClick={() => onSelectDay(ds)}>
        {cur.getDate()}
        {dayTodos.length > 0 && (
          <div className="day-dots">
            {dayTodos.slice(0, 5).map((t, j) => (
              <span key={j} className={`dot dot-${t.priority}`} />
            ))}
            {dayTodos.length > 5 && <span style={{ fontSize: 10, color: '#8a9e95' }}>+{dayTodos.length - 5}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="month-grid">
      {WEEKDAYS.map(w => <div key={w} className="wday">{w}</div>)}
      {cells}
    </div>
  );
}

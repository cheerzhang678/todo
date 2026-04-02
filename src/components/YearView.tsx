import type { Todo } from '../types';
import { MONTHS } from '../utils';

interface Props {
  viewAnchor: Date;
  onMonthClick: (y: number, m: number) => void;
  getFilteredByMonth: (y: number, m: number) => Todo[];
}

export default function YearView({ viewAnchor, onMonthClick, getFilteredByMonth }: Props) {
  const y = viewAnchor.getFullYear();

  return (
    <div className="year-grid">
      {Array.from({ length: 12 }, (_, m) => {
        const mt = getFilteredByMonth(y, m);
        const total = mt.length;
        const done = mt.filter(t => t.done).length;
        const heat = total === 0 ? 0 : total <= 3 ? 1 : total <= 8 ? 2 : total <= 15 ? 3 : 4;

        return (
          <div key={m} className="year-month" onClick={() => onMonthClick(y, m)}>
            <div className="ym-name">{MONTHS[m]}</div>
            <div className={`ym-count ym-heat-${heat}`}>{total}</div>
            <div className="ym-label">{done}已完成</div>
          </div>
        );
      })}
    </div>
  );
}

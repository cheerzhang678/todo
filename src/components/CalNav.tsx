import type { ViewMode } from '../types';
import { WEEKDAYS } from '../utils';

interface Props {
  viewMode: ViewMode;
  viewAnchor: Date;
  onViewChange: (v: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const views: { key: ViewMode; label: string }[] = [
  { key: 'day', label: '日' },
  { key: 'week', label: '周' },
  { key: 'month', label: '月' },
  { key: 'year', label: '年' },
];

function weekStart(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function getNavLabel(viewMode: ViewMode, anchor: Date): string {
  if (viewMode === 'day') {
    return `${anchor.getFullYear()}年${anchor.getMonth() + 1}月${anchor.getDate()}日 周${WEEKDAYS[anchor.getDay()]}`;
  }
  if (viewMode === 'week') {
    const ws = weekStart(anchor);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    return `${ws.getMonth() + 1}月${ws.getDate()}日 - ${we.getMonth() + 1}月${we.getDate()}日`;
  }
  if (viewMode === 'month') {
    return `${anchor.getFullYear()}年${anchor.getMonth() + 1}月`;
  }
  return `${anchor.getFullYear()}年`;
}

export default function CalNav({ viewMode, viewAnchor, onViewChange, onPrev, onNext, onToday }: Props) {
  return (
    <div className="nav">
      <div className="view-tabs">
        {views.map(v => (
          <button key={v.key} className={viewMode === v.key ? 'active' : ''} onClick={() => onViewChange(v.key)}>
            {v.label}
          </button>
        ))}
      </div>
      <div className="nav-mid">
        <button className="arr" onClick={onPrev}>&#8249;</button>
        <span className="label">{getNavLabel(viewMode, viewAnchor)}</span>
        <button className="arr" onClick={onNext}>&#8250;</button>
      </div>
      <button className="today-btn" onClick={onToday}>今天</button>
    </div>
  );
}

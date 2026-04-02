import type { CatFilter } from '../types';

interface Props {
  catFilter: CatFilter;
  onCatChange: (c: CatFilter) => void;
}

const cats: { key: CatFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'work', label: 'WORK' },
  { key: 'life', label: 'LIFE' },
];

export default function Header({ catFilter, onCatChange }: Props) {
  return (
    <div className="header">
      <h1>TASKS</h1>
      <div className="header-sub">A MINIMAL DAILY PLANNER FOR FOCUSED WORK</div>
      <div className="cat-tabs">
        {cats.map(c => (
          <button key={c.key} className={catFilter === c.key ? 'active' : ''} onClick={() => onCatChange(c.key)}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

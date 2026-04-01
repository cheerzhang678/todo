import type { CatFilter } from '../types';

interface Props {
  catFilter: CatFilter;
  onCatChange: (c: CatFilter) => void;
}

const cats: { key: CatFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'work', label: '工作' },
  { key: 'life', label: '生活' },
];

export default function Header({ catFilter, onCatChange }: Props) {
  return (
    <div className="header">
      <h1>待办日历</h1>
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

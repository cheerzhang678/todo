import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { todoToRow } from '../lib/supabase-types';
import { loadTodos } from '../hooks/useTodoStore';

interface Props {
  onJoinBoard: (id: string) => void;
}

export default function BoardLanding({ onJoinBoard }: Props) {
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const localTodos = loadTodos();
  const hasLocalData = localTodos.length > 0;

  const extractBoardId = (input: string): string => {
    // Extract UUID from URL or raw input
    const match = input.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return match ? match[0] : input.trim();
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('boards')
      .insert({ name: '待办看板' })
      .select()
      .single();
    setLoading(false);
    if (err || !data) {
      setError('创建看板失败：' + (err?.message || '未知错误'));
      return;
    }
    onJoinBoard(data.id);
  };

  const handleJoin = async () => {
    const id = extractBoardId(joinId);
    if (!id) { setError('请输入看板 ID 或链接'); return; }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('boards')
      .select('id')
      .eq('id', id)
      .single();
    setLoading(false);
    if (err || !data) {
      setError('看板不存在，请检查链接');
      return;
    }
    onJoinBoard(data.id);
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    // Create board
    const { data: board, error: boardErr } = await supabase
      .from('boards')
      .insert({ name: '导入的看板' })
      .select()
      .single();
    if (boardErr || !board) {
      setLoading(false);
      setError('创建看板失败');
      return;
    }
    // Insert all local todos
    const rows = localTodos.map(t => todoToRow(t, board.id));
    const { error: insertErr } = await supabase.from('todos').insert(rows);
    setLoading(false);
    if (insertErr) {
      setError('导入失败：' + insertErr.message);
      return;
    }
    onJoinBoard(board.id);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="card landing">
        <h2 className="landing-title">协同编辑</h2>
        <p className="landing-desc">未配置 Supabase。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量。</p>
      </div>
    );
  }

  return (
    <div className="card landing">
      <h2 className="landing-title">协同待办看板</h2>
      <p className="landing-desc">创建或加入一个看板，与他人实时协作</p>

      {error && <div className="landing-error">{error}</div>}

      <div className="landing-actions">
        <button className="landing-btn primary" onClick={handleCreate} disabled={loading}>
          {loading ? '创建中...' : '创建新看板'}
        </button>

        <div className="landing-divider">或</div>

        <div className="landing-join">
          <input
            type="text"
            placeholder="粘贴看板链接或 ID..."
            value={joinId}
            onChange={e => setJoinId(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
          />
          <button className="landing-btn" onClick={handleJoin} disabled={loading}>加入</button>
        </div>

        {hasLocalData && (
          <>
            <div className="landing-divider">或</div>
            <button className="landing-btn import" onClick={handleImport} disabled={loading}>
              导入本地 {localTodos.length} 条待办到新看板
            </button>
          </>
        )}
      </div>
    </div>
  );
}

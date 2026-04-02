import { useState } from 'react';
import type { SyncStatus } from '../hooks/useBoardStore';

interface Props {
  boardId: string;
  syncStatus: SyncStatus;
  onlineCount: number;
  syncError: string | null;
}

const statusLabels: Record<SyncStatus, string> = {
  connecting: '连接中',
  connected: '已同步',
  reconnecting: '重连中',
  error: '连接失败',
};

export default function BoardHeader({ boardId, syncStatus, onlineCount, syncError }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="board-header">
      <div className="board-header-left">
        <span className={`sync-dot sync-${syncStatus}`} />
        <span className="sync-label">{statusLabels[syncStatus]}</span>
        {syncStatus === 'connected' && (
          <span className="online-count">{onlineCount} 人在线</span>
        )}
      </div>
      <div className="board-header-right">
        <span className="board-id">ID: {boardId.slice(0, 8)}...</span>
        <button className="share-btn" onClick={handleShare}>
          {copied ? '已复制!' : '分享链接'}
        </button>
      </div>
      {syncError && <div className="sync-error-bar">{syncError}</div>}
    </div>
  );
}

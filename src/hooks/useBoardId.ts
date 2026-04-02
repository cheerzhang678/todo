import { useState, useCallback } from 'react';

export function useBoardId() {
  const getFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('board');
  };

  const [boardId, setBoardIdState] = useState<string | null>(getFromUrl);

  const setBoardId = useCallback((id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('board', id);
    window.history.pushState({}, '', url.toString());
    setBoardIdState(id);
  }, []);

  return { boardId, setBoardId };
}

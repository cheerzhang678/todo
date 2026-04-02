export type Priority = 'P0' | 'P1' | 'P2';
export type Category = 'work' | 'life';
export type ViewMode = 'day' | 'week' | 'month' | 'year';
export type StatusFilter = 'all' | 'active' | 'done';
export type CatFilter = 'all' | Category;

export interface Todo {
  id: number;
  text: string;
  done: boolean;
  priority: Priority;
  category: Category;
  date: string;      // 开始日期 YYYY-MM-DD
  endDate?: string;  // 结束日期 YYYY-MM-DD（可选，不填则为单日任务）
  progress: number;  // 0-100 当前总进度
  dailyProgress?: Record<string, number>; // 每日进度快照 { "2026-04-01": 20, "2026-04-02": 50 }
}

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
  date: string; // YYYY-MM-DD
}

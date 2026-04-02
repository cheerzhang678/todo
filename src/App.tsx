import { useCallback } from 'react';
import type { ViewMode } from './types';
import { fmtDate, parseDate } from './utils';
import { useTodoStore } from './hooks/useTodoStore';
import { useBoardId } from './hooks/useBoardId';
import { useBoardStore } from './hooks/useBoardStore';
import { isSupabaseConfigured } from './lib/supabase';
import Header from './components/Header';
import CalNav from './components/CalNav';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import YearView from './components/YearView';
import TodoList from './components/TodoList';
import AddForm from './components/AddForm';
import BoardLanding from './components/BoardLanding';
import BoardHeader from './components/BoardHeader';
import './App.css';

function LocalApp() {
  const store = useTodoStore();
  return <AppContent store={store} boardId={null} />;
}

function BoardApp({ boardId }: { boardId: string }) {
  const store = useBoardStore(boardId);
  return <AppContent store={store} boardId={boardId} syncStatus={store.syncStatus} onlineCount={store.onlineCount} syncError={store.syncError} />;
}

function AppContent({ store, boardId, syncStatus, onlineCount, syncError }: {
  store: ReturnType<typeof useTodoStore>;
  boardId: string | null;
  syncStatus?: string;
  onlineCount?: number;
  syncError?: string | null;
}) {
  const {
    viewMode, selectedDate, viewAnchor, catFilter, statusFilter,
    setViewMode, setSelectedDate, setViewAnchor, setCatFilter, setStatusFilter,
    addTodo, toggleTodo, deleteTodo, editTodo, updateCategory, updatePriority,
    updateDates, updateRecurrence,
    updateProgress, clearDone, filtered, byDate, byMonth, getProgressForDate,
  } = store;

  const handleViewChange = useCallback((v: ViewMode) => {
    setViewMode(v);
    setViewAnchor(new Date(selectedDate));
  }, [selectedDate, setViewMode, setViewAnchor]);

  const handlePrev = useCallback(() => {
    const a = new Date(viewAnchor);
    if (viewMode === 'day') a.setDate(a.getDate() - 1);
    else if (viewMode === 'week') a.setDate(a.getDate() - 7);
    else if (viewMode === 'month') a.setMonth(a.getMonth() - 1);
    else a.setFullYear(a.getFullYear() - 1);
    setViewAnchor(a);
    setSelectedDate(new Date(a));
  }, [viewMode, viewAnchor, setViewAnchor, setSelectedDate]);

  const handleNext = useCallback(() => {
    const a = new Date(viewAnchor);
    if (viewMode === 'day') a.setDate(a.getDate() + 1);
    else if (viewMode === 'week') a.setDate(a.getDate() + 7);
    else if (viewMode === 'month') a.setMonth(a.getMonth() + 1);
    else a.setFullYear(a.getFullYear() + 1);
    setViewAnchor(a);
    setSelectedDate(new Date(a));
  }, [viewMode, viewAnchor, setViewAnchor, setSelectedDate]);

  const handleToday = useCallback(() => {
    const now = new Date();
    setSelectedDate(now);
    setViewAnchor(new Date(now));
  }, [setSelectedDate, setViewAnchor]);

  const handleSelectDay = useCallback((dateStr: string) => {
    const d = parseDate(dateStr);
    setSelectedDate(d);
    setViewAnchor(new Date(d));
  }, [setSelectedDate, setViewAnchor]);

  const handleMonthClick = useCallback((y: number, m: number) => {
    const d = new Date(y, m, 1);
    setViewAnchor(d);
    setSelectedDate(d);
    setViewMode('month');
  }, [setViewAnchor, setSelectedDate, setViewMode]);

  const getFilteredByDate = useCallback((dateStr: string) => {
    return filtered(byDate(dateStr));
  }, [filtered, byDate]);

  const getFilteredByMonth = useCallback((y: number, m: number) => {
    return filtered(byMonth(y, m));
  }, [filtered, byMonth]);

  const ds = fmtDate(selectedDate);
  const dayTodos = byDate(ds);
  const filteredTodos = filtered(dayTodos);

  return (
    <>
      {boardId && (
        <BoardHeader
          boardId={boardId}
          syncStatus={(syncStatus || 'connected') as 'connecting' | 'connected' | 'reconnecting' | 'error'}
          onlineCount={onlineCount || 1}
          syncError={syncError || null}
        />
      )}

      <Header catFilter={catFilter} onCatChange={setCatFilter} />

      <div className="card">
        <CalNav
          viewMode={viewMode}
          viewAnchor={viewAnchor}
          onViewChange={handleViewChange}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />
        <div className="cal-area">
          {viewMode === 'month' && (
            <MonthView viewAnchor={viewAnchor} selectedDate={selectedDate} onSelectDay={handleSelectDay} getFilteredByDate={getFilteredByDate} />
          )}
          {viewMode === 'week' && (
            <WeekView viewAnchor={viewAnchor} onSelectDay={handleSelectDay} getFilteredByDate={getFilteredByDate} />
          )}
          {viewMode === 'day' && <DayView viewAnchor={viewAnchor} />}
          {viewMode === 'year' && (
            <YearView viewAnchor={viewAnchor} onMonthClick={handleMonthClick} getFilteredByMonth={getFilteredByMonth} />
          )}
        </div>
      </div>

      <TodoList
        selectedDate={selectedDate} todos={dayTodos} filteredTodos={filteredTodos}
        onToggle={toggleTodo} onDelete={deleteTodo} onEdit={editTodo}
        onCategoryChange={updateCategory} onPriorityChange={updatePriority}
        onDatesChange={updateDates} onRecurrenceChange={updateRecurrence}
        onProgressChange={updateProgress} getProgressForDate={getProgressForDate}
        onClearDone={clearDone}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
      />

      <AddForm selectedDate={selectedDate} onAdd={addTodo} />
    </>
  );
}

export default function App() {
  const { boardId, setBoardId } = useBoardId();

  // If Supabase is configured and no board ID, show landing
  if (isSupabaseConfigured && !boardId) {
    return (
      <div className="container">
        <BoardLanding onJoinBoard={setBoardId} />
      </div>
    );
  }

  // If board ID present and Supabase configured, use collaborative mode
  if (boardId && isSupabaseConfigured) {
    return (
      <div className="container">
        <BoardApp boardId={boardId} />
      </div>
    );
  }

  // Fallback: local mode (no Supabase configured)
  return (
    <div className="container">
      <LocalApp />
    </div>
  );
}

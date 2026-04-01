import { useCallback } from 'react';
import type { ViewMode } from './types';
import { fmtDate, parseDate } from './utils';
import { useTodoStore } from './hooks/useTodoStore';
import Header from './components/Header';
import CalNav from './components/CalNav';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import YearView from './components/YearView';
import TodoList from './components/TodoList';
import AddForm from './components/AddForm';
import './App.css';

export default function App() {
  const store = useTodoStore();
  const {
    viewMode, selectedDate, viewAnchor, catFilter, statusFilter,
    setViewMode, setSelectedDate, setViewAnchor, setCatFilter, setStatusFilter,
    addTodo, toggleTodo, deleteTodo, editTodo, clearDone,
    filtered, byDate, byMonth,
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
    <div className="container">
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
        onToggle={toggleTodo} onDelete={deleteTodo} onEdit={editTodo} onClearDone={clearDone}
        statusFilter={statusFilter} onStatusChange={setStatusFilter}
      />

      <AddForm selectedDate={selectedDate} onAdd={addTodo} />
    </div>
  );
}

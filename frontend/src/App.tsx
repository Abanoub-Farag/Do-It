import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { FilterBar, Navbar, type ViewMode } from './components/layout/index.ts';
import { TaskForm } from './components/tasks/index.ts';
import { KanbanView, ListView, MatrixView } from './components/views/index.ts';
import { useTasks } from './hooks/useTasks.ts';
import type { Task, TaskCreate, TaskStatus, TaskUpdate } from './types/task.ts';

function App() {
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const {
    tasks,
    loading,
    error,
    filters,
    setFilters,
    refetch,
    addTask,
    editTask,
    removeTask,
    toggleTaskStatus,
    toggleSubtask,
    addSubtask,
    removeSubtask,
  } = useTasks();

  // Extract unique tags across existing tasks for the tag filter bar
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const t of tasks) {
      if (t.tags) {
        for (const tag of t.tags) {
          if (tag) tagSet.add(tag);
        }
      }
    }
    return Array.from(tagSet);
  }, [tasks]);

  const handleOpenCreate = useCallback(() => {
    setEditingTask(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingTask(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: TaskCreate | TaskUpdate) => {
      if (editingTask) {
        await editTask(editingTask.id, data as TaskUpdate);
      } else {
        await addTask(data as TaskCreate);
      }
    },
    [editingTask, addTask, editTask]
  );

  const handleUpdateTaskStatus = useCallback(
    async (id: number, status: TaskStatus) => {
      await toggleTaskStatus(id, status);
    },
    [toggleTaskStatus]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* Top Navbar */}
      <Navbar
        tasks={tasks}
        onNewTask={handleOpenCreate}
        loading={loading}
      />

      {/* Sticky Filter & View Switcher Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        activeView={activeView}
        onViewChange={setActiveView}
        availableTags={availableTags}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Notification Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-between gap-3 text-sm text-red-300">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading Skeleton Indicator */}
        {loading && tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
            <p className="text-sm">Loading your tasks...</p>
          </div>
        ) : (
          /* Active View Container */
          <div className="transition-all duration-150">
            {activeView === 'list' && (
              <ListView
                tasks={tasks}
                onToggleTask={toggleTaskStatus}
                onEditTask={handleOpenEdit}
                onDeleteTask={removeTask}
                onToggleSubtask={toggleSubtask}
                onAddSubtask={addSubtask}
                onDeleteSubtask={removeSubtask}
                onNewTask={handleOpenCreate}
              />
            )}

            {activeView === 'matrix' && (
              <MatrixView
                tasks={tasks}
                onToggleTask={toggleTaskStatus}
                onEditTask={handleOpenEdit}
                onDeleteTask={removeTask}
                onToggleSubtask={toggleSubtask}
                onAddSubtask={addSubtask}
                onDeleteSubtask={removeSubtask}
              />
            )}

            {activeView === 'kanban' && (
              <KanbanView
                tasks={tasks}
                onToggleTask={toggleTaskStatus}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onEditTask={handleOpenEdit}
                onDeleteTask={removeTask}
                onToggleSubtask={toggleSubtask}
                onAddSubtask={addSubtask}
                onDeleteSubtask={removeSubtask}
                onNewTask={handleOpenCreate}
              />
            )}
          </div>
        )}
      </main>

      {/* Task Creation & Editing Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialTask={editingTask}
      />
    </div>
  );
}

export default App;

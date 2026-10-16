import { CheckCircle2, ChevronDown, ChevronRight, Inbox, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Task } from '../../types/task.ts';
import { TaskCard } from '../tasks/TaskCard.tsx';
import { Button } from '../ui/Button.tsx';

export interface ListViewProps {
  tasks: Task[];
  onToggleTask: (id: number) => Promise<unknown> | void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (id: number) => Promise<unknown> | void;
  onToggleSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  onAddSubtask?: (taskId: number, payload: { title: string }) => Promise<unknown> | void;
  onDeleteSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  onNewTask?: () => void;
}

export function ListView({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onNewTask,
}: ListViewProps) {
  const [showCompleted, setShowCompleted] = useState(true);

  const activeTasks = tasks.filter((t) => t.status !== 'done');
  const completedTasks = tasks.filter((t) => t.status === 'done');

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-zinc-200">No tasks found</h3>
        <p className="mt-1 text-sm text-zinc-400 max-w-sm">
          No tasks match your current filters. Try searching for something else or create a fresh task.
        </p>
        {onNewTask && (
          <div className="mt-5">
            <Button
              variant="primary"
              size="sm"
              onClick={onNewTask}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Task
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Tasks Section */}
      {activeTasks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Tasks ({activeTasks.length})
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleTask={onToggleTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onToggleSubtask={onToggleSubtask}
                onAddSubtask={onAddSubtask}
                onDeleteSubtask={onDeleteSubtask}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks Collapsible Section */}
      {completedTasks.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => setShowCompleted((prev) => !prev)}
            className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors select-none cursor-pointer"
          >
            {showCompleted ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Completed ({completedTasks.length})
            </span>
          </button>

          {showCompleted && (
            <div className="grid grid-cols-1 gap-2.5 animate-in fade-in duration-200">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleTask={onToggleTask}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onToggleSubtask={onToggleSubtask}
                  onAddSubtask={onAddSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

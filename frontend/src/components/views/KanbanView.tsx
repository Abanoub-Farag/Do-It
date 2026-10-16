import { ArrowLeft, ArrowRight, CheckCircle2, CircleDashed, Clock, Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../../types/task.ts';
import { TaskCard } from '../tasks/TaskCard.tsx';

export interface KanbanViewProps {
  tasks: Task[];
  onToggleTask: (id: number) => Promise<unknown> | void;
  onUpdateTaskStatus?: (id: number, status: TaskStatus) => Promise<unknown> | void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (id: number) => Promise<unknown> | void;
  onToggleSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  onAddSubtask?: (taskId: number, payload: { title: string }) => Promise<unknown> | void;
  onDeleteSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  onNewTask?: () => void;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  icon: typeof CircleDashed;
  dotColor: string;
  badgeClass: string;
  nextStatus?: TaskStatus;
  nextLabel?: string;
  prevStatus?: TaskStatus;
  prevLabel?: string;
}

const columns: ColumnConfig[] = [
  {
    id: 'todo',
    title: 'To Do',
    icon: CircleDashed,
    dotColor: 'bg-zinc-400',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700/60',
    nextStatus: 'in_progress',
    nextLabel: 'Start Progress',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Clock,
    dotColor: 'bg-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    prevStatus: 'todo',
    prevLabel: 'Move to To Do',
    nextStatus: 'done',
    nextLabel: 'Mark Done',
  },
  {
    id: 'done',
    title: 'Done',
    icon: CheckCircle2,
    dotColor: 'bg-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    prevStatus: 'in_progress',
    prevLabel: 'Reopen',
  },
];

export function KanbanView({
  tasks,
  onToggleTask,
  onUpdateTaskStatus,
  onEditTask,
  onDeleteTask,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onNewTask,
}: KanbanViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-start">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        const IconComponent = column.icon;

        return (
          <div
            key={column.id}
            className="flex flex-col rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-4 transition-all duration-200"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                <IconComponent className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-100">{column.title}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${column.badgeClass}`}>
                {columnTasks.length}
              </span>
            </div>

            {/* Column Task Cards */}
            <div className="space-y-3 overflow-y-auto max-h-[700px] pr-1">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                  <p className="text-xs">No tasks in {column.title}</p>
                  {column.id === 'todo' && onNewTask && (
                    <button
                      type="button"
                      onClick={onNewTask}
                      className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add task
                    </button>
                  )}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div key={task.id} className="space-y-1.5">
                    <TaskCard
                      task={task}
                      onToggleTask={onToggleTask}
                      onEditTask={onEditTask}
                      onDeleteTask={onDeleteTask}
                      onToggleSubtask={onToggleSubtask}
                      onAddSubtask={onAddSubtask}
                      onDeleteSubtask={onDeleteSubtask}
                    />

                    {/* Quick 1-click status transition buttons */}
                    {onUpdateTaskStatus && (column.prevStatus || column.nextStatus) && (
                      <div className="flex items-center justify-between px-2 pt-0.5 text-[11px]">
                        {column.prevStatus ? (
                          <button
                            type="button"
                            onClick={() => onUpdateTaskStatus(task.id, column.prevStatus!)}
                            className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>{column.prevLabel}</span>
                          </button>
                        ) : (
                          <span />
                        )}

                        {column.nextStatus && (
                          <button
                            type="button"
                            onClick={() => onUpdateTaskStatus(task.id, column.nextStatus!)}
                            className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium transition-colors ml-auto"
                          >
                            <span>{column.nextLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { AlertCircle, CalendarClock, CheckCircle, ShieldAlert } from 'lucide-react';
import type { Priority, Task } from '../../types/task.ts';
import { TaskCard } from '../tasks/TaskCard.tsx';

export interface MatrixViewProps {
  tasks: Task[];
  onToggleTask: (id: number) => Promise<unknown> | void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (id: number) => Promise<unknown> | void;
  onStartFocus?: (task: Task) => void;
  onToggleSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  onAddSubtask?: (taskId: number, payload: { title: string }) => Promise<unknown> | void;
  onDeleteSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
}

interface QuadrantInfo {
  id: Priority;
  title: string;
  subtitle: string;
  icon: typeof AlertCircle;
  accentBadge: string;
  borderHover: string;
}

const quadrants: QuadrantInfo[] = [
  {
    id: 'urgent',
    title: 'Urgent & Important',
    subtitle: 'Do First',
    icon: ShieldAlert,
    accentBadge: 'bg-red-500/15 text-red-400 border-red-500/30',
    borderHover: 'hover:border-red-500/30',
  },
  {
    id: 'high',
    title: 'Not Urgent & Important',
    subtitle: 'Schedule',
    icon: CalendarClock,
    accentBadge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    borderHover: 'hover:border-blue-500/30',
  },
  {
    id: 'medium',
    title: 'Urgent & Not Important',
    subtitle: 'Delegate / Quick',
    icon: AlertCircle,
    accentBadge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    borderHover: 'hover:border-amber-500/30',
  },
  {
    id: 'low',
    title: 'Neither Urgent Nor Important',
    subtitle: 'Eliminate / Later',
    icon: CheckCircle,
    accentBadge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    borderHover: 'hover:border-zinc-500/30',
  },
];

export function MatrixView({
  tasks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onStartFocus,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}: MatrixViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      {quadrants.map((quad) => {
        const quadTasks = tasks.filter((t) => t.priority === quad.id);
        const IconComponent = quad.icon;

        return (
          <div
            key={quad.id}
            className={`flex flex-col rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-4 transition-all duration-200 ${quad.borderHover}`}
          >
            {/* Quadrant Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <span className={`p-1.5 rounded-lg border ${quad.accentBadge}`}>
                  <IconComponent className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    {quad.title}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">
                    {quad.subtitle}
                  </span>
                </div>
              </div>

              {/* Task Count Badge */}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                {quadTasks.length}
              </span>
            </div>

            {/* Quadrant Tasks Container */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[640px] pr-1">
              {quadTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500">
                  <p className="text-xs">No tasks in this quadrant</p>
                </div>
              ) : (
                quadTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleTask={onToggleTask}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    onStartFocus={onStartFocus}
                    onToggleSubtask={onToggleSubtask}
                    onAddSubtask={onAddSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

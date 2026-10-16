import { format, isPast, isToday, isTomorrow, isValid, parseISO } from 'date-fns';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ListChecks,
  Pencil,
  Timer,
  Trash2,
} from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import type { Task } from '../../types/task.ts';
import { Badge } from '../ui/Badge.tsx';
import { TagBadge } from '../ui/TagBadge.tsx';
import { SubtaskList } from './SubtaskList.tsx';

export interface TaskCardProps {
  task: Task;
  onToggleTask: (id: number) => Promise<unknown> | void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (id: number) => Promise<unknown> | void;
  onStartFocus?: (task: Task) => void;
  onToggleSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  onAddSubtask?: (taskId: number, payload: { title: string }) => Promise<unknown> | void;
  onDeleteSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  defaultExpanded?: boolean;
  className?: string;
}

function formatDueDate(dateString?: string | null): { text: string; isOverdue: boolean } | null {
  if (!dateString) return null;

  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return null;

    const overdue = isPast(date) && !isToday(date);

    if (isToday(date)) {
      return { text: 'Today', isOverdue: false };
    }
    if (isTomorrow(date)) {
      return { text: 'Tomorrow', isOverdue: false };
    }
    return {
      text: format(date, 'MMM d, yyyy'),
      isOverdue: overdue,
    };
  } catch {
    return null;
  }
}

export function TaskCard({
  task,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onStartFocus,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  defaultExpanded = false,
  className = '',
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isDone = task.status === 'done';
  const dueDateInfo = formatDueDate(task.due_date);
  const isOverdue = dueDateInfo?.isOverdue && !isDone;

  const subtasksCount = task.subtasks?.length ?? 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;

  const handleCardClick = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleToggleDone = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleTask(task.id);
  };

  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation();
    onEditTask?.(task);
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    onDeleteTask?.(task.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition-all duration-200
        hover:border-zinc-700 hover:shadow-lg hover:shadow-black/40 cursor-pointer select-none
        ${isDone ? 'opacity-70 bg-zinc-950/40' : ''}
        ${className}`}
    >
      {/* Main Row / Header */}
      <div className="flex items-start justify-between gap-3">
        {/* Toggle Checkbox + Title / Description */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Circular status toggle button */}
          <button
            type="button"
            onClick={handleToggleDone}
            className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center border transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
              ${
                isDone
                  ? 'bg-purple-600 border-purple-500 text-white shadow-sm shadow-purple-600/30'
                  : 'bg-zinc-800/80 border-zinc-600 hover:border-purple-400 hover:bg-zinc-800 text-transparent'
              }`}
            aria-label={`Mark task as ${isDone ? 'incomplete' : 'done'}`}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </button>

          {/* Title and Preview */}
          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm sm:text-base font-semibold leading-snug tracking-tight transition-colors duration-150 ${
                isDone
                  ? 'line-through text-zinc-500'
                  : 'text-zinc-100 group-hover:text-purple-300'
              }`}
            >
              {task.title}
            </h4>

            {task.description && (
              <p className="mt-1 text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Priority Badge & Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Badge priority={task.priority} />

          {onStartFocus && !isDone && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartFocus(task);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400"
              aria-label="Start Focus mode"
              title="Focus Mode"
            >
              <Timer className="w-3.5 h-3.5" />
            </button>
          )}

          {onEditTask && (
            <button
              type="button"
              onClick={handleEdit}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400"
              aria-label="Edit task"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {onDeleteTask && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
              aria-label="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Meta Row */}
      <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60 text-xs">
        {/* Due Date Badge */}
        {dueDateInfo && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium transition-colors ${
              isOverdue
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{dueDateInfo.text}</span>
            {isOverdue && <span className="text-[10px] uppercase font-bold tracking-wider">(Overdue)</span>}
          </span>
        )}

        {/* Estimated / Actual Minutes */}
        {(task.estimated_minutes != null || task.actual_minutes > 0) && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 border border-zinc-700/60">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>
              {task.actual_minutes > 0 && task.estimated_minutes != null
                ? `${task.actual_minutes}m / ${task.estimated_minutes}m`
                : task.estimated_minutes != null
                  ? `${task.estimated_minutes}m est`
                  : `${task.actual_minutes}m spent`}
            </span>
          </span>
        )}

        {/* Subtask count pill */}
        {subtasksCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <ListChecks className="w-3 h-3 text-purple-400" />
            <span>
              {completedSubtasks}/{subtasksCount}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            )}
          </button>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 ml-auto">
            {task.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {/* Expandable Section: SubtaskList */}
      {isExpanded && onToggleSubtask && (
        <div className="mt-3 pt-3 border-t border-zinc-800/80 animate-in fade-in duration-200">
          <SubtaskList
            taskId={task.id}
            subtasks={task.subtasks ?? []}
            onToggleSubtask={onToggleSubtask}
            onAddSubtask={onAddSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />
        </div>
      )}
    </div>
  );
}

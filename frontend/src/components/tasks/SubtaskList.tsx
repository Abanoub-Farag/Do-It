import { Check, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type MouseEvent } from 'react';
import type { Subtask } from '../../types/task.ts';

export interface SubtaskListProps {
  taskId: number;
  subtasks: Subtask[];
  onToggleSubtask: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  onAddSubtask?: (taskId: number, payload: { title: string }) => Promise<unknown> | void;
  onDeleteSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  className?: string;
}

export function SubtaskList({
  taskId,
  subtasks,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  className = '',
}: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleToggle = (e: MouseEvent, subtaskId: number) => {
    e.stopPropagation();
    onToggleSubtask(taskId, subtaskId);
  };

  const handleDelete = (e: MouseEvent, subtaskId: number) => {
    e.stopPropagation();
    onDeleteSubtask?.(taskId, subtaskId);
  };

  const handleQuickAdd = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = newTitle.trim();
    if (!trimmed || isSubmitting || !onAddSubtask) return;

    try {
      setIsSubmitting(true);
      await onAddSubtask(taskId, { title: trimmed });
      setNewTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`space-y-3 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mini Progress Indicator */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Subtasks</span>
            <span className="font-medium">
              {completed} of {total} completed ({percentage}%)
            </span>
          </div>
          <div
            className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                percentage === 100 ? 'bg-emerald-500' : 'bg-purple-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtasks Checklist */}
      <ul className="space-y-1.5">
        {subtasks.map((subtask) => (
          <li
            key={subtask.id}
            className="group flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors"
          >
            <div
              className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none flex-1"
              onClick={(e) => handleToggle(e, subtask.id)}
            >
              {/* Custom Checkbox */}
              <button
                type="button"
                onClick={(e) => handleToggle(e, subtask.id)}
                className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900
                  ${
                    subtask.completed
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-zinc-800/60 border-zinc-600/80 hover:border-purple-400'
                  }`}
                aria-label={`Mark "${subtask.title}" as ${subtask.completed ? 'incomplete' : 'complete'}`}
              >
                {subtask.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>

              <span
                className={`text-sm truncate transition-colors duration-150 ${
                  subtask.completed
                    ? 'line-through text-zinc-500'
                    : 'text-zinc-200'
                }`}
              >
                {subtask.title}
              </span>
            </div>

            {/* Delete Subtask Button */}
            {onDeleteSubtask && (
              <button
                type="button"
                onClick={(e) => handleDelete(e, subtask.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 rounded transition-all duration-150 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                aria-label={`Delete subtask "${subtask.title}"`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Inline Quick-Add Input */}
      {onAddSubtask && (
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a new subtask..."
            disabled={isSubmitting}
            className="flex-1 bg-zinc-900/80 border border-zinc-800 focus:border-purple-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || isSubmitting}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60 hover:bg-zinc-700 hover:text-white active:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      )}
    </div>
  );
}

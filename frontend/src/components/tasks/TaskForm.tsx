import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import type { Priority, Task, TaskCreate, TaskUpdate } from '../../types/task.ts';
import { Button } from '../ui/Button.tsx';
import { Modal } from '../ui/Modal.tsx';
import { TagBadge } from '../ui/TagBadge.tsx';

export interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskCreate | TaskUpdate) => Promise<unknown> | void;
  initialTask?: Task | null;
}

const priorityOptions: { value: Priority; label: string; activeColor: string }[] = [
  {
    value: 'urgent',
    label: 'Urgent',
    activeColor: 'bg-red-500/20 text-red-400 border-red-500/40 ring-1 ring-red-500/30',
  },
  {
    value: 'high',
    label: 'High',
    activeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40 ring-1 ring-amber-500/30',
  },
  {
    value: 'medium',
    label: 'Medium',
    activeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40 ring-1 ring-blue-500/30',
  },
  {
    value: 'low',
    label: 'Low',
    activeColor: 'bg-zinc-700/50 text-zinc-300 border-zinc-600 ring-1 ring-zinc-500/30',
  },
];

interface TaskFormContentProps {
  initialTask?: Task | null;
  onClose: () => void;
  onSubmit: (data: TaskCreate | TaskUpdate) => Promise<unknown> | void;
}

function TaskFormContent({ initialTask, onClose, onSubmit }: TaskFormContentProps) {
  const isEditing = Boolean(initialTask);

  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [description, setDescription] = useState(initialTask?.description ?? '');
  const [priority, setPriority] = useState<Priority>(initialTask?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(
    initialTask?.due_date ? initialTask.due_date.substring(0, 16) : ''
  );
  const [tags, setTags] = useState<string[]>(initialTask?.tags ? [...initialTask.tags] : []);
  const [tagInput, setTagInput] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(
    initialTask?.estimated_minutes ?? ''
  );
  const [initialSubtasks, setInitialSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = () => {
    const trimmed = subtaskInput.trim();
    if (trimmed) {
      setInitialSubtasks((prev) => [...prev, trimmed]);
      setSubtaskInput('');
    }
  };

  const handleSubtaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setInitialSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        const payload: TaskUpdate = {
          title: cleanTitle,
          description: description.trim() || null,
          priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          tags,
          estimated_minutes:
            estimatedMinutes !== '' ? Number(estimatedMinutes) : null,
        };
        await onSubmit(payload);
      } else {
        const payload: TaskCreate = {
          title: cleanTitle,
          description: description.trim() || null,
          priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          tags,
          estimated_minutes:
            estimatedMinutes !== '' ? Number(estimatedMinutes) : null,
          subtasks: initialSubtasks.map((stTitle) => ({
            title: stTitle,
            completed: false,
          })),
        };
        await onSubmit(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Title input */}
      <div className="space-y-1">
        <label
          htmlFor="task-title"
          className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider"
        >
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          required
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Design priority matrix view"
          className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder:text-zinc-500 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent transition-all"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label
          htmlFor="task-desc"
          className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider"
        >
          Description
        </label>
        <textarea
          id="task-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add relevant context or notes for this task..."
          className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder:text-zinc-500 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent transition-all resize-y"
        />
      </div>

      {/* Priority Segmented Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          Priority
        </label>
        <div className="grid grid-cols-4 gap-2">
          {priorityOptions.map((opt) => {
            const isSelected = priority === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all duration-150 select-none cursor-pointer text-center
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                  ${
                    isSelected
                      ? opt.activeColor
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meta row: Due Date & Estimated Minutes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label
            htmlFor="task-due-date"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Due Date</span>
          </label>
          <input
            id="task-due-date"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent transition-all"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="task-est-minutes"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 uppercase tracking-wider"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Estimated Minutes</span>
          </label>
          <input
            id="task-est-minutes"
            type="number"
            min="0"
            step="5"
            value={estimatedMinutes}
            onChange={(e) =>
              setEstimatedMinutes(
                e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0)
              )
            }
            placeholder="e.g. 60"
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Tags input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          Tags
        </label>
        <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-700/80 space-y-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  onRemove={() => handleRemoveTag(tag)}
                />
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Type tag and press Enter..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="px-2 py-1 rounded bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Initial Subtasks (only in create mode) */}
      {!isEditing && (
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Initial Subtasks
          </label>
          <div className="space-y-2">
            {initialSubtasks.length > 0 && (
              <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {initialSubtasks.map((st, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-xs text-zinc-200"
                  >
                    <span className="truncate">{st}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                      aria-label={`Remove subtask "${st}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                placeholder="Add a subtask and press Enter..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!subtaskInput.trim()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
        <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Save Changes'
              : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}

export function TaskForm({ isOpen, onClose, onSubmit, initialTask }: TaskFormProps) {
  const isEditing = Boolean(initialTask);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      description={
        isEditing
          ? 'Update task details and priority.'
          : 'Define a task with priority, tags, and initial subtasks.'
      }
      maxWidth="xl"
    >
      <TaskFormContent
        key={`${initialTask?.id ?? 'create'}-${isOpen}`}
        initialTask={initialTask}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}

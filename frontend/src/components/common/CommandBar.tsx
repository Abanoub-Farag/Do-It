import {
  ArrowRight,
  Columns3,
  Filter,
  Flame,
  LayoutGrid,
  List,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Priority, Task } from '../../types/task.ts';
import { Badge } from '../ui/Badge.tsx';

export interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onNewTask: (prefillTitle?: string) => void;
  onViewChange: (view: 'list' | 'matrix' | 'kanban') => void;
  onFilterPriority?: (priority?: Priority) => void;
  onSelectTask?: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
}

interface CommandItem {
  id: string;
  category: 'Actions' | 'Views' | 'Filters' | 'Tasks';
  title: string;
  subtitle?: string;
  icon: ReactNode;
  run: () => void;
  badge?: ReactNode;
}

interface CommandBarContentProps {
  onClose: () => void;
  tasks: Task[];
  onNewTask: (prefillTitle?: string) => void;
  onViewChange: (view: 'list' | 'matrix' | 'kanban') => void;
  onFilterPriority?: (priority?: Priority) => void;
  onSelectTask?: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
}

function CommandBarContent({
  onClose,
  tasks,
  onNewTask,
  onViewChange,
  onFilterPriority,
  onSelectTask,
  onStartFocus,
}: CommandBarContentProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const items = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];
    const q = query.trim().toLowerCase();

    // 1. Create Task Action
    list.push({
      id: 'create-task',
      category: 'Actions',
      title: q ? `Create task: "${query.trim()}"` : 'Create a new task',
      subtitle: 'Opens task creation modal',
      icon: <Plus className="w-4 h-4 text-purple-400" />,
      run: () => {
        onNewTask(q ? query.trim() : undefined);
        onClose();
      },
    });

    // 2. View Switch Actions
    const views = [
      { id: 'view-list', name: 'Switch to List View', view: 'list' as const, icon: <List className="w-4 h-4 text-zinc-400" /> },
      { id: 'view-matrix', name: 'Switch to Matrix View', view: 'matrix' as const, icon: <LayoutGrid className="w-4 h-4 text-zinc-400" /> },
      { id: 'view-kanban', name: 'Switch to Kanban Board', view: 'kanban' as const, icon: <Columns3 className="w-4 h-4 text-zinc-400" /> },
    ];
    for (const v of views) {
      if (!q || v.name.toLowerCase().includes(q) || v.view.includes(q)) {
        list.push({
          id: v.id,
          category: 'Views',
          title: v.name,
          icon: v.icon,
          run: () => {
            onViewChange(v.view);
            onClose();
          },
        });
      }
    }

    // 3. Priority Filters
    if (onFilterPriority) {
      const priorities: { p: Priority; label: string }[] = [
        { p: 'urgent', label: 'Filter: Urgent Priority' },
        { p: 'high', label: 'Filter: High Priority' },
        { p: 'medium', label: 'Filter: Medium Priority' },
        { p: 'low', label: 'Filter: Low Priority' },
      ];
      for (const pr of priorities) {
        if (!q || pr.label.toLowerCase().includes(q) || pr.p.includes(q)) {
          list.push({
            id: `filter-${pr.p}`,
            category: 'Filters',
            title: pr.label,
            icon: <Filter className="w-4 h-4 text-amber-400" />,
            run: () => {
              onFilterPriority(pr.p);
              onClose();
            },
          });
        }
      }
    }

    // 4. Task Search Results
    if (q) {
      const matchingTasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );

      for (const t of matchingTasks.slice(0, 5)) {
        list.push({
          id: `task-${t.id}`,
          category: 'Tasks',
          title: t.title,
          subtitle: t.status === 'done' ? 'Completed' : t.description || undefined,
          icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
          badge: <Badge priority={t.priority} />,
          run: () => {
            onSelectTask?.(t);
            onClose();
          },
        });
      }
    }

    return list;
  }, [query, tasks, onNewTask, onViewChange, onFilterPriority, onSelectTask, onClose]);

  // Derived safe selected index
  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, items.length - 1));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[safeSelectedIndex]) {
        items[safeSelectedIndex].run();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/80 overflow-hidden z-10 transition-all duration-150 animate-in zoom-in-95 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-zinc-800/90">
          <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search tasks..."
            className="w-full py-4 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching commands or tasks found
            </div>
          ) : (
            items.map((item, index) => {
              const isSelected = index === safeSelectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.run}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer select-none transition-colors duration-100
                    ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <div className="min-w-0 truncate">
                      <p className="text-xs sm:text-sm font-medium leading-none truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p
                          className={`text-[11px] mt-1 truncate ${
                            isSelected ? 'text-purple-200' : 'text-zinc-400'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge}
                    {item.id.startsWith('task-') && onStartFocus && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const taskId = Number(item.id.replace('task-', ''));
                          const target = tasks.find((t) => t.id === taskId);
                          if (target) {
                            onStartFocus(target);
                            onClose();
                          }
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          isSelected
                            ? 'hover:bg-purple-700 text-white'
                            : 'hover:bg-zinc-700 text-zinc-400 hover:text-purple-300'
                        }`}
                        title="Start Focus Mode"
                      >
                        <Flame className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 opacity-80" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 bg-zinc-950/60 text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-[10px] text-zinc-300 mr-1">↑↓</kbd>
              Navigate
            </span>
            <span>
              <kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-[10px] text-zinc-300 mr-1">↵</kbd>
              Select
            </span>
          </div>
          <span className="hidden sm:inline">Press Esc to dismiss</span>
        </div>
      </div>
    </div>
  );
}

export function CommandBar({
  isOpen,
  onClose,
  tasks,
  onNewTask,
  onViewChange,
  onFilterPriority,
  onSelectTask,
  onStartFocus,
}: CommandBarProps) {
  if (!isOpen) return null;

  return (
    <CommandBarContent
      key={isOpen ? 'open' : 'closed'}
      onClose={onClose}
      tasks={tasks}
      onNewTask={onNewTask}
      onViewChange={onViewChange}
      onFilterPriority={onFilterPriority}
      onSelectTask={onSelectTask}
      onStartFocus={onStartFocus}
    />
  );
}

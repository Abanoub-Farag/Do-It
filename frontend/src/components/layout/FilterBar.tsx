import {
  Columns3,
  Filter,
  Hash,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';
import type { Priority, TaskFilterParams, TaskStatus } from '../../types/task.ts';

export type ViewMode = 'list' | 'matrix' | 'kanban';

export interface FilterBarProps {
  filters: TaskFilterParams;
  onFilterChange: (filters: TaskFilterParams) => void;
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  availableTags: string[];
}

const statusOptions: { label: string; value: TaskStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

const priorityOptions: { label: string; value: Priority | undefined; color: string }[] = [
  { label: 'All Priorities', value: undefined, color: 'text-zinc-400' },
  { label: 'Urgent', value: 'urgent', color: 'text-red-400' },
  { label: 'High', value: 'high', color: 'text-amber-400' },
  { label: 'Medium', value: 'medium', color: 'text-blue-400' },
  { label: 'Low', value: 'low', color: 'text-zinc-400' },
];

export function FilterBar({
  filters,
  onFilterChange,
  activeView,
  onViewChange,
  availableTags,
}: FilterBarProps) {
  const [prevFilterSearch, setPrevFilterSearch] = useState(filters.search ?? '');
  const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

  if ((filters.search ?? '') !== prevFilterSearch) {
    setPrevFilterSearch(filters.search ?? '');
    setSearchTerm(filters.search ?? '');
  }

  // Debounce search update by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchTerm.trim();
      const current = filters.search ?? '';
      if (trimmed !== current) {
        onFilterChange({
          ...filters,
          search: trimmed || undefined,
        });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, filters, onFilterChange]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    onFilterChange({ ...filters, search: undefined });
  };

  const handleStatusChange = (status: TaskStatus | undefined) => {
    onFilterChange({ ...filters, status });
  };

  const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as Priority | 'all';
    onFilterChange({
      ...filters,
      priority: val === 'all' ? undefined : val,
    });
  };

  const handleTagToggle = (tag: string) => {
    onFilterChange({
      ...filters,
      tag: filters.tag === tag ? undefined : tag,
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    onFilterChange({});
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.priority || filters.tag
  );

  return (
    <div className="sticky top-16 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* Top Control Bar: Search + Priority Dropdown + View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search tasks, descriptions..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Priority Filter & View Switcher */}
          <div className="flex items-center gap-2.5 justify-between sm:justify-end">
            {/* Priority Selector */}
            <div className="relative flex items-center">
              <Filter className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <select
                value={filters.priority ?? 'all'}
                onChange={handlePriorityChange}
                className="pl-8 pr-7 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300
                  hover:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition-colors cursor-pointer appearance-none"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.label} value={opt.value ?? 'all'} className="bg-zinc-900 text-zinc-200">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {/* View Switcher Segmented Control */}
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => onViewChange('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer
                  ${
                    activeView === 'list'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => onViewChange('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer
                  ${
                    activeView === 'matrix'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                title="Eisenhower Matrix View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => onViewChange('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer
                  ${
                    activeView === 'kanban'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                title="Kanban Board View"
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Board</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Status Tabs + Active Tags */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {statusOptions.map((opt) => {
              const isSelected = filters.status === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleStatusChange(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap cursor-pointer
                    ${
                      isSelected
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                    }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Tags Chips Bar */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 shrink-0">
                Tags:
              </span>
              {availableTags.map((tag) => {
                const isSelected = filters.tag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-150 whitespace-nowrap cursor-pointer
                      ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                  >
                    <Hash className="w-3 h-3 shrink-0" />
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import type { Priority } from '../../types/task.ts';

export interface BadgeProps {
  priority: Priority;
  children?: ReactNode;
  className?: string;
  showDot?: boolean;
}

const priorityStyles: Record<Priority, { badge: string; dot: string; label: string }> = {
  urgent: {
    badge: 'bg-red-500/10 text-red-500 border-red-500/20',
    dot: 'bg-red-500 shadow-sm shadow-red-500/50',
    label: 'Urgent',
  },
  high: {
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    dot: 'bg-amber-500 shadow-sm shadow-amber-500/50',
    label: 'High',
  },
  medium: {
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    dot: 'bg-blue-500 shadow-sm shadow-blue-500/50',
    label: 'Medium',
  },
  low: {
    badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    dot: 'bg-zinc-400 shadow-sm shadow-zinc-400/50',
    label: 'Low',
  },
};

export function Badge({ priority, children, className = '', showDot = true }: BadgeProps) {
  const config = priorityStyles[priority] ?? priorityStyles.medium;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border tracking-wide uppercase ${config.badge} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`}
          aria-hidden="true"
        />
      )}
      {children ?? config.label}
    </span>
  );
}

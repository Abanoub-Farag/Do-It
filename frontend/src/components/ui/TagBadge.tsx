import { Hash, X } from 'lucide-react';
import type { MouseEvent } from 'react';

export interface TagBadgeProps {
  tag: string;
  className?: string;
  onClick?: () => void;
  onRemove?: () => void;
}

export function TagBadge({
  tag,
  className = '',
  onClick,
  onRemove,
}: TagBadgeProps) {
  const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <span
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border
        bg-zinc-800/80 text-zinc-300 border-zinc-700/60 transition-colors duration-150
        ${onClick ? 'cursor-pointer hover:bg-zinc-700 hover:text-white hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400' : ''}
        ${className}`}
    >
      <Hash className="w-3 h-3 text-zinc-500 shrink-0" aria-hidden="true" />
      <span>{cleanTag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-0.5 -mr-1 p-0.5 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
          aria-label={`Remove tag ${cleanTag}`}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

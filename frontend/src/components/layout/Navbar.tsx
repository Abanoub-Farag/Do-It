import { CheckCircle2, Clock, ListChecks, Plus, Sparkles } from 'lucide-react';
import type { Task } from '../../types/task.ts';
import { Button } from '../ui/Button.tsx';

export interface NavbarProps {
  tasks: Task[];
  onNewTask: () => void;
  loading?: boolean;
}

export function Navbar({ tasks, onNewTask, loading = false }: NavbarProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const pending = total - completed;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">Do-It</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase tracking-widest">
                <Sparkles className="w-2.5 h-2.5" />
                Vibe
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-zinc-400 font-medium">
              Task Matrix & Focus System
            </p>
          </div>
        </div>

        {/* Quick Stats Widget */}
        <div className="hidden md:flex items-center gap-4 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-400 shadow-inner">
          <div className="flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-zinc-400" />
            <span>Total:</span>
            <span className="font-semibold text-zinc-200">{total}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending:</span>
            <span className="font-semibold text-amber-300">{pending}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Done:</span>
            <span className="font-semibold text-emerald-300">{completed}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={onNewTask}
            disabled={loading}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="shadow-md shadow-purple-600/20"
          >
            <span>New Task</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

import { CheckCircle2, Flame, Timer, TrendingUp } from 'lucide-react';
import type { AnalyticsSummary } from '../../types/task.ts';

export interface StatsOverviewProps {
  summary: AnalyticsSummary;
  className?: string;
}

function formatFocusTime(minutes: number): string {
  if (minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export function StatsOverview({ summary, className = '' }: StatsOverviewProps) {
  // Compare today vs yesterday completed count
  const weekly = summary.weekly_activity ?? [];
  const todayItem = weekly.length >= 1 ? weekly[weekly.length - 1] : undefined;
  const yesterdayItem = weekly.length >= 2 ? weekly[weekly.length - 2] : undefined;

  const todayCount = todayItem?.completed_count ?? summary.completed_today;
  const yesterdayCount = yesterdayItem?.completed_count ?? 0;
  const diff = todayCount - yesterdayCount;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {/* 1. Completed Today */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 flex flex-col justify-between hover:border-zinc-700/80 transition-colors">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Completed Today</span>
          <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {summary.completed_today}
          </div>
          <p className="mt-1 text-xs text-zinc-400 flex items-center gap-1">
            {diff > 0 ? (
              <span className="text-emerald-400 font-medium">+{diff} vs yesterday</span>
            ) : diff < 0 ? (
              <span className="text-zinc-400 font-medium">{diff} vs yesterday</span>
            ) : (
              <span className="text-zinc-400 font-medium">Same as yesterday</span>
            )}
          </p>
        </div>
      </div>

      {/* 2. Focus Time Today */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 flex flex-col justify-between hover:border-zinc-700/80 transition-colors">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Focus Time Today</span>
          <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Timer className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatFocusTime(summary.total_focus_minutes_today)}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Pomodoro focus logged
          </p>
        </div>
      </div>

      {/* 3. Current Streak */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 flex flex-col justify-between hover:border-zinc-700/80 transition-colors">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Current Streak</span>
          <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Flame className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
            <span>{summary.current_streak_days}</span>
            <span className="text-sm font-medium text-zinc-400">
              {summary.current_streak_days === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {summary.current_streak_days > 0 ? 'Consecutive active streak 🔥' : 'Complete a task to start streak'}
          </p>
        </div>
      </div>

      {/* 4. Completion Rate */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-4 flex flex-col justify-between hover:border-zinc-700/80 transition-colors">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
          <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {summary.completion_rate}%
            </span>
            <span className="text-xs font-medium text-zinc-400">
              {summary.total_tasks} total
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, summary.completion_rate))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

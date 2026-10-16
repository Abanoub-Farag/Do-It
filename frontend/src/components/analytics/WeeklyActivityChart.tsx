import { BarChart3, Calendar } from 'lucide-react';
import { useMemo } from 'react';
import type { DailyActivity } from '../../types/task.ts';

export interface WeeklyActivityChartProps {
  activity: DailyActivity[];
  className?: string;
}

export function WeeklyActivityChart({ activity, className = '' }: WeeklyActivityChartProps) {
  const maxCompleted = useMemo(() => {
    if (!activity || activity.length === 0) return 1;
    const maxVal = Math.max(...activity.map((a) => a.completed_count));
    return maxVal > 0 ? maxVal : 4;
  }, [activity]);

  const totalWeeklyCompleted = useMemo(() => {
    return activity.reduce((sum, a) => sum + a.completed_count, 0);
  }, [activity]);

  const totalWeeklyMinutes = useMemo(() => {
    return activity.reduce((sum, a) => sum + a.focus_minutes, 0);
  }, [activity]);

  return (
    <div
      className={`rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 space-y-4 hover:border-zinc-700/80 transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <BarChart3 className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">7-Day Completion Velocity</h3>
            <p className="text-xs text-zinc-400">Daily finished tasks & focus breakdown</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <div>
            <span className="text-zinc-500 mr-1">7d Total:</span>
            <span className="font-semibold text-zinc-200">{totalWeeklyCompleted} tasks</span>
          </div>
          <div>
            <span className="text-zinc-500 mr-1">7d Focus:</span>
            <span className="font-semibold text-purple-400">{totalWeeklyMinutes}m</span>
          </div>
        </div>
      </div>

      {/* Chart Bars Area */}
      <div className="h-48 pt-6 pb-2 flex items-end justify-between gap-2 sm:gap-4 px-2 select-none">
        {activity.map((item, index) => {
          const isToday = index === activity.length - 1;
          const ratio = maxCompleted > 0 ? item.completed_count / maxCompleted : 0;
          // Calculate percentage height; ensure at least 6% so the baseline bar is visible
          const heightPercent = item.completed_count > 0 ? Math.max(12, Math.round(ratio * 100)) : 6;

          return (
            <div
              key={item.date}
              className="flex-1 h-full flex flex-col items-center justify-end group relative cursor-pointer"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-zinc-900 border border-zinc-700/80 px-2.5 py-1.5 rounded-lg shadow-xl shadow-black/60 text-[11px] text-zinc-200 pointer-events-none whitespace-nowrap z-20 scale-95 group-hover:scale-100">
                <div className="font-semibold text-white flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <span>
                    {item.day_name}, {item.date} {isToday ? '(Today)' : ''}
                  </span>
                </div>
                <div className="mt-0.5 text-zinc-300">
                  <span className="text-emerald-400 font-bold">{item.completed_count}</span> tasks completed
                  {item.focus_minutes > 0 && (
                    <span className="text-purple-400 ml-1">({item.focus_minutes}m focus)</span>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div className="w-full flex justify-center items-end h-full">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 relative flex items-center justify-center ${
                    isToday
                      ? 'bg-gradient-to-t from-purple-600 to-indigo-500 group-hover:from-purple-500 group-hover:to-indigo-400 shadow-sm shadow-purple-600/30'
                      : item.completed_count > 0
                        ? 'bg-zinc-700/80 group-hover:bg-zinc-600'
                        : 'bg-zinc-800/40 group-hover:bg-zinc-800'
                  }`}
                >
                  {item.completed_count > 0 && (
                    <span className="text-[10px] font-bold text-white drop-shadow -translate-y-0.5 opacity-90">
                      {item.completed_count}
                    </span>
                  )}
                </div>
              </div>

              {/* Day label below */}
              <div className="mt-2 text-center">
                <span
                  className={`text-xs block leading-tight ${
                    isToday ? 'font-bold text-purple-400' : 'text-zinc-400 font-medium'
                  }`}
                >
                  {item.day_name}
                </span>
                <span className="text-[10px] text-zinc-500 block leading-tight">
                  {item.date.slice(5)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

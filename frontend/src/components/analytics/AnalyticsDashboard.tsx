import {
  ChevronDown,
  ChevronUp,
  LineChart,
  Loader2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getAnalyticsSummary } from '../../api/tasks.ts';
import type { AnalyticsSummary } from '../../types/task.ts';
import { StatsOverview } from './StatsOverview.tsx';
import { WeeklyActivityChart } from './WeeklyActivityChart.tsx';

export interface AnalyticsDashboardProps {
  tasksVersion?: number;
  className?: string;
  defaultExpanded?: boolean;
}

export function AnalyticsDashboard({
  tasksVersion = 0,
  className = '',
  defaultExpanded = true,
}: AnalyticsDashboardProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and auto-refresh asynchronously when tasksVersion changes
  useEffect(() => {
    let isCancelled = false;

    getAnalyticsSummary()
      .then((data) => {
        if (!isCancelled) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [tasksVersion]);

  return (
    <div
      className={`rounded-2xl bg-zinc-900/50 border border-zinc-800/90 overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Banner / Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-zinc-900/80 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-400">
            <LineChart className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Productivity Insights</h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                <Sparkles className="w-2.5 h-2.5" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">
              Daily streaks, completion metrics & weekly velocity
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400 disabled:opacity-50"
            title="Refresh analytics"
            aria-label="Refresh analytics"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400 select-none cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={handleRefresh}
                className="underline hover:text-red-300 ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {loading && !summary ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <p className="text-xs">Calculating productivity stats...</p>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {/* 4 Stats Cards */}
              <StatsOverview summary={summary} />

              {/* 7-Day Velocity Chart */}
              <WeeklyActivityChart activity={summary.weekly_activity} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

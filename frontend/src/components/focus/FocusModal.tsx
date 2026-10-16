import {
  Check,
  CheckCircle2,
  Coffee,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Task } from '../../types/task.ts';
import { Badge } from '../ui/Badge.tsx';

export type PomodoroPreset = 'focus' | 'shortBreak' | 'longBreak';

const PRESET_DURATIONS: Record<PomodoroPreset, { label: string; seconds: number; icon: typeof Flame }> = {
  focus: { label: 'Focus (25m)', seconds: 25 * 60, icon: Flame },
  shortBreak: { label: 'Short Break (5m)', seconds: 5 * 60, icon: Coffee },
  longBreak: { label: 'Long Break (15m)', seconds: 15 * 60, icon: Sparkles },
};

export interface FocusModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onLogTime: (taskId: number, additionalMinutes: number) => Promise<unknown> | void;
  onToggleSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  onToggleTask?: (taskId: number) => Promise<unknown> | void;
}

interface FocusModalContentProps {
  task: Task;
  onClose: () => void;
  onLogTime: (taskId: number, additionalMinutes: number) => Promise<unknown> | void;
  onToggleSubtask?: (taskId: number, subtaskId: number) => Promise<unknown> | void;
  onToggleTask?: (taskId: number) => Promise<unknown> | void;
}

function playSynthChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const playTone = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + duration);
    };

    playTone(587.33, 0, 0.35); // D5
    playTone(880.0, 0.22, 0.55); // A5
  } catch {
    // Audio context may fail if user hasn't interacted or policy blocks
  }
}

function FocusModalContent({
  task,
  onClose,
  onLogTime,
  onToggleSubtask,
  onToggleTask,
}: FocusModalContentProps) {
  const [preset, setPreset] = useState<PomodoroPreset>('focus');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(PRESET_DURATIONS.focus.seconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const accumulatedSecondsRef = useRef<number>(0);
  const taskRef = useRef<Task>(task);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  const totalSeconds = PRESET_DURATIONS[preset].seconds;
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const flushElapsedTime = useCallback(() => {
    const elapsedMinutes = Math.round(accumulatedSecondsRef.current / 60);
    if (elapsedMinutes > 0) {
      onLogTime(taskRef.current.id, elapsedMinutes);
    }
    accumulatedSecondsRef.current = 0;
  }, [onLogTime]);

  const handleSelectPreset = (newPreset: PomodoroPreset) => {
    setPreset(newPreset);
    setSecondsRemaining(PRESET_DURATIONS[newPreset].seconds);
    setIsRunning(false);
    setIsCompleted(false);
  };

  const handleReset = () => {
    setSecondsRemaining(PRESET_DURATIONS[preset].seconds);
    setIsRunning(false);
    setIsCompleted(false);
  };

  const handleCompleteEarly = () => {
    setIsRunning(false);
    setIsCompleted(true);
    setSecondsRemaining(0);
    playSynthChime();
    flushElapsedTime();
  };

  const handleClose = () => {
    flushElapsedTime();
    setIsRunning(false);
    onClose();
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          setIsCompleted(true);
          playSynthChime();
          flushElapsedTime();
          return 0;
        }

        if (preset === 'focus') {
          accumulatedSecondsRef.current += 1;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, preset, flushElapsedTime]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Header / Exit */}
      <div className="absolute top-5 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">
            Focus Mode
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          aria-label="Exit Focus Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-lg flex flex-col items-center text-center my-auto py-10 space-y-8">
        {/* Presets Segmented Selector */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-inner">
          {(Object.keys(PRESET_DURATIONS) as PomodoroPreset[]).map((pKey) => {
            const p = PRESET_DURATIONS[pKey];
            const Icon = p.icon;
            const isSelected = preset === pKey;
            return (
              <button
                key={pKey}
                type="button"
                onClick={() => handleSelectPreset(pKey)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer
                  ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Circular Timer Ring */}
        <div className="relative flex items-center justify-center">
          <svg className="w-64 h-64 -rotate-90 transform" viewBox="0 0 240 240">
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-zinc-800/80"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className={`transition-all duration-1000 ease-linear ${
                isCompleted
                  ? 'text-emerald-500'
                  : preset === 'focus'
                    ? 'text-purple-500'
                    : 'text-blue-500'
              }`}
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center select-none">
            <span className="text-5xl font-mono font-extrabold tracking-tighter text-white drop-shadow">
              {formattedTime}
            </span>
            <span className="mt-1 text-xs font-medium text-zinc-400 uppercase tracking-widest">
              {isCompleted ? 'Completed' : isRunning ? 'In Progress' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsRunning((prev) => !prev)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 active:scale-95 ${
              isRunning
                ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
                : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/30'
            }`}
            aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
          >
            {isRunning ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 active:scale-95"
            title="Reset Timer"
            aria-label="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {isRunning && (
            <button
              type="button"
              onClick={handleCompleteEarly}
              className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Complete Early</span>
            </button>
          )}
        </div>

        {/* Active Task Context Card */}
        <div className="w-full text-left rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 space-y-3.5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                Active Task
              </span>
              <h4 className="text-base font-semibold text-white leading-snug truncate">
                {task.title}
              </h4>
              {task.description && (
                <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            <Badge priority={task.priority} />
          </div>

          {/* Subtasks checklist if present */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="pt-3 border-t border-zinc-800/60 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Target Subtasks ({task.subtasks.filter((s) => s.completed).length}/
                {task.subtasks.length})
              </span>
              <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {task.subtasks.map((subtask) => (
                  <li
                    key={subtask.id}
                    onClick={() => onToggleSubtask?.(task.id, subtask.id)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-800/40 border border-zinc-700/40 hover:border-zinc-600 transition-colors cursor-pointer select-none"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                        subtask.completed
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'border-zinc-600'
                      }`}
                    >
                      {subtask.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span
                      className={`text-xs truncate ${
                        subtask.completed ? 'line-through text-zinc-500' : 'text-zinc-300'
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Mark Task Done */}
          {onToggleTask && task.status !== 'done' && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Task as Done</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FocusModal({
  isOpen,
  task,
  onClose,
  onLogTime,
  onToggleSubtask,
  onToggleTask,
}: FocusModalProps) {
  if (!isOpen || !task) return null;

  return (
    <FocusModalContent
      key={`${task.id}-${isOpen}`}
      task={task}
      onClose={onClose}
      onLogTime={onLogTime}
      onToggleSubtask={onToggleSubtask}
      onToggleTask={onToggleTask}
    />
  );
}

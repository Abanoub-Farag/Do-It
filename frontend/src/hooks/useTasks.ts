import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  createSubtask,
  createTask,
  deleteSubtask,
  deleteTask,
  getTasks,
  updateSubtask,
  updateTask,
} from '../api/tasks.ts';
import type {
  Priority,
  Subtask,
  SubtaskCreate,
  Task,
  TaskCreate,
  TaskFilterParams,
  TaskStatus,
  TaskUpdate,
} from '../types/task.ts';

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: TaskFilterParams;
  setFilters: Dispatch<SetStateAction<TaskFilterParams>>;
  refetch: () => Promise<void>;
  addTask: (payload: TaskCreate) => Promise<Task>;
  editTask: (id: number, payload: TaskUpdate) => Promise<Task>;
  removeTask: (id: number) => Promise<void>;
  toggleTaskStatus: (id: number, nextStatus?: TaskStatus) => Promise<Task>;
  toggleSubtask: (taskId: number, subtaskId: number) => Promise<Subtask>;
  addSubtask: (taskId: number, payload: SubtaskCreate) => Promise<Subtask>;
  removeSubtask: (taskId: number, subtaskId: number) => Promise<void>;
}

export function useTasks(initialFilters?: TaskFilterParams): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilterParams>(initialFilters ?? {});

  const tasksRef = useRef<Task[]>(tasks);
  const filtersRef = useRef<TaskFilterParams>(filters);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const refetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTasks(filtersRef.current);
      setTasks(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadTasks() {
      setLoading(true);
      setError(null);
      try {
        const data = await getTasks(filters);
        if (!isCancelled) {
          setTasks(data);
        }
      } catch (err) {
        if (!isCancelled) {
          const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
          setError(message);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      isCancelled = true;
    };
  }, [filters]);

  const addTask = useCallback(async (payload: TaskCreate): Promise<Task> => {
    try {
      const created = await createTask(payload);
      setTasks((prev) => [created, ...prev]);
      setError(null);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      setError(message);
      throw err;
    }
  }, []);

  const editTask = useCallback(
    async (id: number, payload: TaskUpdate): Promise<Task> => {
      const previousTask = tasksRef.current.find((t) => t.id === id);
      if (!previousTask) {
        throw new Error(`Task with id ${id} not found`);
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...payload,
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );

      try {
        const updated = await updateTask(id, payload);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        setError(null);
        return updated;
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === id ? previousTask : t)));
        const message = err instanceof Error ? err.message : 'Failed to update task';
        setError(message);
        throw err;
      }
    },
    []
  );

  const removeTask = useCallback(async (id: number): Promise<void> => {
    const previousIndex = tasksRef.current.findIndex((t) => t.id === id);
    const previousTask = previousIndex >= 0 ? tasksRef.current[previousIndex] : undefined;

    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTask(id);
      setError(null);
    } catch (err) {
      if (previousTask) {
        setTasks((prev) => {
          const next = [...prev];
          next.splice(previousIndex, 0, previousTask);
          return next;
        });
      }
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      setError(message);
      throw err;
    }
  }, []);

  const toggleTaskStatus = useCallback(
    async (id: number, nextStatus?: TaskStatus): Promise<Task> => {
      const currentTask = tasksRef.current.find((t) => t.id === id);
      if (!currentTask) {
        throw new Error(`Task with id ${id} not found`);
      }

      const previousStatus = currentTask.status;
      const targetStatus: TaskStatus =
        nextStatus ?? (previousStatus === 'done' ? 'todo' : 'done');

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: targetStatus, updated_at: new Date().toISOString() }
            : t
        )
      );

      try {
        const updated = await updateTask(id, { status: targetStatus });
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        setError(null);
        return updated;
      } catch (err) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: previousStatus } : t))
        );
        const message = err instanceof Error ? err.message : 'Failed to toggle task status';
        setError(message);
        throw err;
      }
    },
    []
  );

  const toggleSubtask = useCallback(
    async (taskId: number, subtaskId: number): Promise<Subtask> => {
      const currentTask = tasksRef.current.find((t) => t.id === taskId);
      const currentSubtask = currentTask?.subtasks.find((st) => st.id === subtaskId);

      if (!currentTask || !currentSubtask) {
        throw new Error(`Subtask with id ${subtaskId} in task ${taskId} not found`);
      }

      const previousCompleted = currentSubtask.completed;
      const targetCompleted = !previousCompleted;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, completed: targetCompleted } : st
            ),
          };
        })
      );

      try {
        const updated = await updateSubtask(taskId, subtaskId, {
          completed: targetCompleted,
        });
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              subtasks: t.subtasks.map((st) =>
                st.id === subtaskId ? updated : st
              ),
            };
          })
        );
        setError(null);
        return updated;
      } catch (err) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              subtasks: t.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed: previousCompleted } : st
              ),
            };
          })
        );
        const message = err instanceof Error ? err.message : 'Failed to toggle subtask';
        setError(message);
        throw err;
      }
    },
    []
  );

  const addSubtask = useCallback(
    async (taskId: number, payload: SubtaskCreate): Promise<Subtask> => {
      try {
        const created = await createSubtask(taskId, payload);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...t.subtasks, created] }
              : t
          )
        );
        setError(null);
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add subtask';
        setError(message);
        throw err;
      }
    },
    []
  );

  const removeSubtask = useCallback(
    async (taskId: number, subtaskId: number): Promise<void> => {
      const currentTask = tasksRef.current.find((t) => t.id === taskId);
      const subtaskIndex =
        currentTask?.subtasks.findIndex((st) => st.id === subtaskId) ?? -1;
      const subtaskToRemove =
        subtaskIndex >= 0 && currentTask ? currentTask.subtasks[subtaskIndex] : undefined;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId) }
            : t
        )
      );

      try {
        await deleteSubtask(taskId, subtaskId);
        setError(null);
      } catch (err) {
        if (subtaskToRemove) {
          setTasks((prev) =>
            prev.map((t) => {
              if (t.id !== taskId) return t;
              const nextSubtasks = [...t.subtasks];
              nextSubtasks.splice(subtaskIndex, 0, subtaskToRemove);
              return { ...t, subtasks: nextSubtasks };
            })
          );
        }
        const message = err instanceof Error ? err.message : 'Failed to delete subtask';
        setError(message);
        throw err;
      }
    },
    []
  );

  return {
    tasks,
    loading,
    error,
    filters,
    setFilters,
    refetch,
    addTask,
    editTask,
    removeTask,
    toggleTaskStatus,
    toggleSubtask,
    addSubtask,
    removeSubtask,
  };
}

export type { Priority, TaskStatus };

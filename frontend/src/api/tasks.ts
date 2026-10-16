import { apiClient } from './client.ts';
import type {
  Subtask,
  SubtaskCreate,
  Task,
  TaskCreate,
  TaskFilterParams,
  TaskUpdate,
} from '../types/task.ts';

export async function getTasks(params?: TaskFilterParams): Promise<Task[]> {
  return apiClient.get<Task[]>('/api/tasks', {
    params: params as Record<string, string | number | boolean | undefined | null>,
  });
}

export async function getTaskById(id: number): Promise<Task> {
  return apiClient.get<Task>(`/api/tasks/${id}`);
}

export async function createTask(payload: TaskCreate): Promise<Task> {
  return apiClient.post<Task>('/api/tasks', payload);
}

export async function updateTask(id: number, payload: TaskUpdate): Promise<Task> {
  return apiClient.patch<Task>(`/api/tasks/${id}`, payload);
}

export async function deleteTask(id: number): Promise<void> {
  return apiClient.delete<void>(`/api/tasks/${id}`);
}

export async function createSubtask(taskId: number, payload: SubtaskCreate): Promise<Subtask> {
  return apiClient.post<Subtask>(`/api/tasks/${taskId}/subtasks`, payload);
}

export async function updateSubtask(
  taskId: number,
  subtaskId: number,
  payload: { completed?: boolean; title?: string }
): Promise<Subtask> {
  return apiClient.patch<Subtask>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, payload);
}

export async function deleteSubtask(taskId: number, subtaskId: number): Promise<void> {
  return apiClient.delete<void>(`/api/tasks/${taskId}/subtasks/${subtaskId}`);
}

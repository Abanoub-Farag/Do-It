export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  completed: boolean;
}

export interface SubtaskCreate {
  title: string;
  completed?: boolean;
}

export interface SubtaskUpdate {
  title?: string;
  completed?: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date?: string | null;
  tags: string[];
  estimated_minutes?: number | null;
  actual_minutes: number;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  due_date?: string | null;
  tags?: string[];
  estimated_minutes?: number | null;
  actual_minutes?: number;
  subtasks?: SubtaskCreate[];
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  due_date?: string | null;
  tags?: string[];
  estimated_minutes?: number | null;
  actual_minutes?: number;
}

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: Priority;
  tag?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

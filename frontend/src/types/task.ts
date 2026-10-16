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

export interface DailyActivity {
  date: string;
  day_name: string;
  completed_count: number;
  focus_minutes: number;
}

export interface AnalyticsSummary {
  total_tasks: number;
  completed_today: number;
  total_focus_minutes_today: number;
  completion_rate: number;
  current_streak_days: number;
  weekly_activity: DailyActivity[];
}

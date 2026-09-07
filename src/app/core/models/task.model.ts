// A Kanban column is really just a task status — the union type below is
// what powers both the board columns and each task's own status field.
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  boardId: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string; // ISO date string, e.g. '2026-09-10'
  tags: string[];
}

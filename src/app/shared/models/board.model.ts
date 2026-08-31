// Shared data shapes used across the Kanban app.
// Keeping them in one place means every component/service agrees on the same structure.

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
}

export interface Column {
  id: string;
  name: string;
  taskIds: string[]; // references Task.id, so tasks live in one flat list
}

export interface Board {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  tasks: Task[];
}

import { TaskStatus } from './task.model';

// The four Kanban columns are the same across every board, so a column's id
// is just a TaskStatus rather than its own separate identity.
export interface Column {
  id: TaskStatus;
  name: string;
}

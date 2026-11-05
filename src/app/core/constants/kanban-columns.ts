import { Column } from '../models/column.model';

/*
 * The four Kanban columns are fixed configuration, not server data, so they
 * are a constant here instead of an API call.
 */
export const KANBAN_COLUMNS: Column[] = [
  { id: 'todo', name: 'To Do' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'completed', name: 'Completed' },
];

// Returns undefined for an unknown id (e.g. a mistyped URL).
export function findColumn(id: string): Column | undefined {
  return KANBAN_COLUMNS.find((column) => column.id === id);
}

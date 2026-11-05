import { Board } from '../../../core/models/board.model';
import { Task } from '../../../core/models/task.model';

export type BoardFilter = 'all' | 'active' | 'completed';
export type BoardSort = 'name' | 'recent';

export interface BoardQuery {
  search?: string;
  filter?: BoardFilter;
  sort?: BoardSort;
}

// Everything the Boards feature owns in the NgRx store. Both boards and
// tasks live here — a board's progress/status is *derived* from tasks in
// boards.selectors.ts rather than stored, so this shape never gets out of
// sync with itself.
export interface BoardsState {
  boards: Board[];
  tasks: Task[];
  // HTTP LAB: true while the initial GET requests are in flight.
  loading: boolean;
  // HTTP LAB: true once data has been fetched successfully. Acts as a
  // cache flag, so later page visits reuse the Store instead of refetching.
  loaded: boolean;
  // HTTP LAB: true while a POST/PUT/DELETE is in flight. Kept separate
  // from `loading` so saving a form disables its buttons without
  // replacing the page with a "Loading…" message.
  saving: boolean;
  error: string | null;
}

export const initialBoardsState: BoardsState = {
  boards: [],
  tasks: [],
  loading: false,
  loaded: false,
  saving: false,
  error: null,
};

export const boardsFeatureKey = 'boards';

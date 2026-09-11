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
  loading: boolean;
  error: string | null;
}

export const initialBoardsState: BoardsState = {
  boards: [],
  tasks: [],
  loading: false,
  error: null,
};

export const boardsFeatureKey = 'boards';

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Board } from '../../../core/models/board.model';
import { Task, TaskStatus } from '../../../core/models/task.model';
import {
  BoardFilter,
  BoardQuery,
  BoardsState,
  boardsFeatureKey,
} from './boards.state';

/*
 * Selectors are reusable, memoized queries for reading Store data.
 * Components use selectors instead of depending directly on the complete
 * Store structure or repeating filtering and calculation logic.
 */

/*
 * FEATURE SELECTOR
 *
 * This is the entry point into the 'boards' feature state.
 * All the selectors below build on this selector.
 */
export const selectBoardsState =
  createFeatureSelector<BoardsState>(boardsFeatureKey);

/*
 * BASIC SELECTORS
 *
 * Each selector returns one property from BoardsState.
 */
export const selectAllBoards = createSelector(
  selectBoardsState,
  (state) => state.boards,
);

export const selectAllTasks = createSelector(
  selectBoardsState,
  (state) => state.tasks,
);

export const selectBoardsLoading = createSelector(
  selectBoardsState,
  (state) => state.loading,
);

// HTTP LAB: true once the API data is in the Store (used for caching).
export const selectBoardsLoaded = createSelector(
  selectBoardsState,
  (state) => state.loaded,
);

// HTTP LAB: true while a POST/PUT/DELETE request is in flight.
export const selectBoardsSaving = createSelector(
  selectBoardsState,
  (state) => state.saving,
);

export const selectBoardsError = createSelector(
  selectBoardsState,
  (state) => state.error,
);

// HTTP LAB: an error from the initial GET requests only. Pages use this to
// show "error + Retry" instead of their content. Failed saves are not
// included — they are shown as toasts and the page stays usable.
export const selectLoadError = createSelector(
  selectBoardsState,
  (state) => (state.loaded ? null : state.error),
);

/*
 * PARAMETERIZED SELECTORS
 *
 * These are selector factories: calling one with an ID creates a selector
 * for that specific board, task, or group of tasks.
 */

// Find one board using its ID.
export const selectBoardById = (boardId: number) =>
  createSelector(selectAllBoards, (boards) =>
    boards.find((board) => board.id === boardId),
  );

// Return every task for a board, optionally limited to one status/column.
export const selectTasksForBoard = (
  boardId: number,
  status?: TaskStatus,
) =>
  createSelector(selectAllTasks, (tasks) =>
    tasks.filter(
      (task) =>
        task.boardId === boardId &&
        (!status || task.status === status),
    ),
  );

// Find one task while also confirming that it belongs to the given board.
export const selectTaskByBoardAndId = (
  boardId: number,
  taskId: number,
) =>
  createSelector(selectAllTasks, (tasks) =>
    tasks.find(
      (task) => task.boardId === boardId && task.id === taskId,
    ),
  );

/*
 * DERIVED STATE
 *
 * Board progress is calculated from tasks instead of being stored
 * separately. This avoids keeping duplicated values synchronized.
 */
export interface BoardProgress {
  completed: number;
  total: number;
  status: BoardFilter;
}

/*
 * This helper contains the application's single definition of board
 * progress. Both progress selectors below reuse the same calculation.
 */
function computeBoardProgress(
  tasks: Task[],
  boardId: number,
): BoardProgress {
  const boardTasks = tasks.filter(
    (task) => task.boardId === boardId,
  );

  const completed = boardTasks.filter(
    (task) => task.status === 'completed',
  ).length;

  const status: BoardFilter =
    boardTasks.length > 0 && completed === boardTasks.length
      ? 'completed'
      : 'active';

  return {
    completed,
    total: boardTasks.length,
    status,
  };
}

// Calculate progress for one board.
export const selectBoardProgress = (boardId: number) =>
  createSelector(selectAllTasks, (tasks) =>
    computeBoardProgress(tasks, boardId),
  );

export interface BoardSummary {
  board: Board;
  progress: BoardProgress;
}

/*
 * FILTERED BOARD LIST
 *
 * This selector combines boards and tasks because it needs:
 * - Board information for search and sorting
 * - Task information for progress and completion filtering
 *
 * Keeping this logic in a selector leaves BoardListComponent focused on
 * dispatching actions and presenting data.
 */
export const selectFilteredBoardSummaries = (query: BoardQuery) =>
  createSelector(
    selectAllBoards,
    selectAllTasks,
    (boards, tasks): BoardSummary[] => {
      // Normalize missing query values and make searching case-insensitive.
      const search = query.search?.trim().toLowerCase() ?? '';
      const filter = query.filter ?? 'all';
      const sort = query.sort ?? 'recent';

      // Search by board name or description.
      const matching = boards.filter(
        (board) =>
          !search ||
          board.name.toLowerCase().includes(search) ||
          board.description.toLowerCase().includes(search),
      );

      // Attach derived task progress to every matching board.
      const summaries = matching.map((board) => ({
        board,
        progress: computeBoardProgress(tasks, board.id),
      }));

      // Apply the active/completed filter when one is selected.
      const filtered =
        filter === 'all'
          ? summaries
          : summaries.filter(
              (summary) => summary.progress.status === filter,
            );

      /*
       * Copy the array before sorting so selector inputs are never mutated.
       * Sort either alphabetically or by the latest update timestamp.
       */
      return [...filtered].sort((a, b) =>
        sort === 'name'
          ? a.board.name.localeCompare(b.board.name)
          : b.board.updatedAt - a.board.updatedAt,
      );
    },
  );
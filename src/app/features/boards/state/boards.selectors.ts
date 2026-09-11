import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Board } from '../../../core/models/board.model';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { BoardFilter, BoardQuery, BoardsState, boardsFeatureKey } from './boards.state';

// Selectors are reusable, memoized state queries — components read state
// through these instead of reaching into the store shape directly, so
// filtering/derivation logic exists in exactly one place.
export const selectBoardsState = createFeatureSelector<BoardsState>(boardsFeatureKey);

export const selectAllBoards = createSelector(selectBoardsState, (state) => state.boards);
export const selectAllTasks = createSelector(selectBoardsState, (state) => state.tasks);
export const selectBoardsLoading = createSelector(selectBoardsState, (state) => state.loading);
export const selectBoardsError = createSelector(selectBoardsState, (state) => state.error);

export const selectBoardById = (boardId: number) =>
  createSelector(selectAllBoards, (boards) => boards.find((board) => board.id === boardId));

export const selectTasksForBoard = (boardId: number, status?: TaskStatus) =>
  createSelector(selectAllTasks, (tasks) =>
    tasks.filter((task) => task.boardId === boardId && (!status || task.status === status)),
  );

export const selectTaskByBoardAndId = (boardId: number, taskId: number) =>
  createSelector(selectAllTasks, (tasks) =>
    tasks.find((task) => task.boardId === boardId && task.id === taskId),
  );

export interface BoardProgress {
  completed: number;
  total: number;
  status: BoardFilter;
}

// A board's status for filtering purposes ('active' vs 'completed') is
// derived from its tasks — there's no separate field to keep in sync by
// hand. Shared by selectBoardProgress below and the filtered-boards
// selector, so the definition of "completed" only lives in one place.
function computeBoardProgress(tasks: Task[], boardId: number): BoardProgress {
  const boardTasks = tasks.filter((task) => task.boardId === boardId);
  const completed = boardTasks.filter((task) => task.status === 'completed').length;
  const status: BoardFilter =
    boardTasks.length > 0 && completed === boardTasks.length ? 'completed' : 'active';
  return { completed, total: boardTasks.length, status };
}

export const selectBoardProgress = (boardId: number) =>
  createSelector(selectAllTasks, (tasks) => computeBoardProgress(tasks, boardId));

export interface BoardSummary {
  board: Board;
  progress: BoardProgress;
}

// Search, filter and sort all happen here so BoardListComponent stays a
// thin template over query params, with no filtering logic of its own to
// keep in sync with the store.
export const selectFilteredBoardSummaries = (query: BoardQuery) =>
  createSelector(selectAllBoards, selectAllTasks, (boards, tasks): BoardSummary[] => {
    const search = query.search?.trim().toLowerCase() ?? '';
    const filter = query.filter ?? 'all';
    const sort = query.sort ?? 'recent';

    const matching = boards.filter(
      (board) =>
        !search ||
        board.name.toLowerCase().includes(search) ||
        board.description.toLowerCase().includes(search),
    );

    const summaries = matching.map((board) => ({ board, progress: computeBoardProgress(tasks, board.id) }));
    const filtered = filter === 'all' ? summaries : summaries.filter((s) => s.progress.status === filter);

    return [...filtered].sort((a, b) =>
      sort === 'name'
        ? a.board.name.localeCompare(b.board.name)
        : b.board.updatedAt - a.board.updatedAt,
    );
  });

import { createReducer, on } from '@ngrx/store';
import * as BoardsActions from './boards.actions';
import { BoardsState, initialBoardsState } from './boards.state';

/*
 * A reducer is a pure, synchronous function:
 *
 * current state + action → new state
 *
 * It never calls services, navigates, shows notifications, or performs
 * asynchronous work. Those operations belong in Effects.
 *
 * The spread operator, map(), and filter() create new objects and arrays
 * instead of mutating the existing Store state.
 */

// HTTP LAB: shared helpers for the "write request started / failed" steps,
// which are identical for every POST, PUT and DELETE below.
const startSaving = (state: BoardsState): BoardsState => ({
  ...state,
  saving: true,
  error: null,
});

const saveFailed = (state: BoardsState, { error }: { error: string }): BoardsState => ({
  ...state,
  saving: false,
  error,
});

export const boardsReducer = createReducer(
  initialBoardsState,

  /*
   * LOAD BOARD DATA (GET /boards + GET /tasks)
   *
   * If data is already loaded (cached), the state is returned unchanged
   * and the Effect skips the HTTP call — see loadBoardData$.
   */
  on(BoardsActions.loadBoardData, (state) =>
    state.loaded ? state : { ...state, loading: true, error: null },
  ),

  on(BoardsActions.loadBoardDataSuccess, (state, { boards, tasks }) => ({
    ...state,
    boards,
    tasks,
    loading: false,
    loaded: true,
  })),

  on(BoardsActions.loadBoardDataFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  /*
   * WRITE REQUESTS (POST / PUT / DELETE)
   *
   * Every request action sets saving: true; every failure stores the error.
   */
  on(
    BoardsActions.addBoard,
    BoardsActions.deleteBoard,
    BoardsActions.addTask,
    BoardsActions.updateTask,
    BoardsActions.deleteTask,
    startSaving,
  ),

  on(
    BoardsActions.addBoardFailure,
    BoardsActions.deleteBoardFailure,
    BoardsActions.addTaskFailure,
    BoardsActions.updateTaskFailure,
    BoardsActions.deleteTaskFailure,
    saveFailed,
  ),

  /*
   * WRITE SUCCESSES
   *
   * The Store is updated with what the SERVER returned, so the UI always
   * matches the API without a page reload.
   */

  // Append the board returned by POST /boards (it now has a real id).
  on(BoardsActions.addBoardSuccess, (state, { board }) => ({
    ...state,
    boards: [...state.boards, board],
    saving: false,
  })),

  // Remove the deleted board and all of its tasks.
  on(BoardsActions.deleteBoardSuccess, (state, { boardId }) => ({
    ...state,
    boards: state.boards.filter((board) => board.id !== boardId),
    tasks: state.tasks.filter((task) => task.boardId !== boardId),
    saving: false,
  })),

  // Append the task returned by POST /tasks.
  on(BoardsActions.addTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task],
    saving: false,
  })),

  // Replace only the task returned by PUT /tasks/:id.
  on(BoardsActions.updateTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map((existingTask) => (existingTask.id === task.id ? task : existingTask)),
    saving: false,
  })),

  // Remove the task deleted by DELETE /tasks/:id.
  on(BoardsActions.deleteTaskSuccess, (state, { taskId }) => ({
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId),
    saving: false,
  })),

  /*
   * Clearing an error changes only the error property and preserves all
   * board, task, and loading data.
   */
  on(BoardsActions.clearBoardsError, (state) => ({
    ...state,
    error: null,
  })),
);

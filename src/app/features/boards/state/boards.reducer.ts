import { createReducer, on } from '@ngrx/store';
import * as BoardsActions from './boards.actions';
import { initialBoardsState } from './boards.state';

// A reducer is a pure, synchronous function: (state, action) => new state.
// It never mutates the old state, never calls a service, and never awaits
// anything — all of that already happened in an Effect before a *Success or
// *Failure action ever reaches here. Every handler below returns a brand
// new object/array instead of changing the one it was given.
export const boardsReducer = createReducer(
  initialBoardsState,

  on(BoardsActions.loadBoardData, (state) => ({ ...state, loading: true, error: null })),
  on(BoardsActions.loadBoardDataSuccess, (state, { boards, tasks }) => ({
    ...state,
    boards,
    tasks,
    loading: false,
  })),
  on(BoardsActions.loadBoardDataFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(BoardsActions.addBoard, (state) => ({ ...state, loading: true, error: null })),
  on(BoardsActions.addBoardSuccess, (state, { board }) => ({
    ...state,
    boards: [...state.boards, board],
    loading: false,
  })),
  on(BoardsActions.addBoardFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(BoardsActions.addTask, (state) => ({ ...state, loading: true, error: null })),
  on(BoardsActions.addTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task],
    loading: false,
  })),
  on(BoardsActions.addTaskFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(BoardsActions.updateTask, (state) => ({ ...state, loading: true, error: null })),
  // Only the one matching task is replaced — every other task keeps its
  // original object reference, which is what lets memoized selectors
  // elsewhere skip recomputing for tasks that didn't change.
  on(BoardsActions.updateTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map((existing) => (existing.id === task.id ? task : existing)),
    loading: false,
  })),
  on(BoardsActions.updateTaskFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(BoardsActions.deleteTask, (state) => ({ ...state, loading: true, error: null })),
  on(BoardsActions.deleteTaskSuccess, (state, { taskId }) => ({
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId),
    loading: false,
  })),
  on(BoardsActions.deleteTaskFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(BoardsActions.clearBoardsError, (state) => ({ ...state, error: null })),
);

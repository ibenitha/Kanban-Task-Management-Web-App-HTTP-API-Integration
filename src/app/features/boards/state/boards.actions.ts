import { createAction, props } from '@ngrx/store';
import { Board } from '../../../core/models/board.model';
import { Task } from '../../../core/models/task.model';

// Actions describe events, not logic — every write to the store below is
// grouped as request / success / failure, so an Effect can sit in the
// middle and turn a request into a real (simulated) API call.

// ---- Load: dispatched by any page that needs board/task data ----
export const loadBoardData = createAction('[Boards Page] Load Board Data');
export const loadBoardDataSuccess = createAction(
  '[Boards API] Load Board Data Success',
  props<{ boards: Board[]; tasks: Task[] }>(),
);
export const loadBoardDataFailure = createAction(
  '[Boards API] Load Board Data Failure',
  props<{ error: string }>(),
);

// ---- Add board (from the create-board form on the boards list) ----
export const addBoard = createAction(
  '[Boards Page] Add Board',
  props<{ name: string; description: string }>(),
);
export const addBoardSuccess = createAction(
  '[Boards API] Add Board Success',
  props<{ board: Board }>(),
);
export const addBoardFailure = createAction(
  '[Boards API] Add Board Failure',
  props<{ error: string }>(),
);

// ---- Add task (from the add-task form) ----
export const addTask = createAction('[Task Form] Add Task', props<{ task: Omit<Task, 'id'> }>());
export const addTaskSuccess = createAction('[Boards API] Add Task Success', props<{ task: Task }>());
export const addTaskFailure = createAction('[Boards API] Add Task Failure', props<{ error: string }>());

// ---- Update task (from the task edit form) ----
export const updateTask = createAction(
  '[Task Form] Update Task',
  props<{ boardId: number; taskId: number; changes: Partial<Omit<Task, 'id' | 'boardId'>> }>(),
);
export const updateTaskSuccess = createAction(
  '[Boards API] Update Task Success',
  props<{ task: Task }>(),
);
export const updateTaskFailure = createAction(
  '[Boards API] Update Task Failure',
  props<{ error: string }>(),
);

// ---- Delete task (from the task edit form) ----
export const deleteTask = createAction(
  '[Task Form] Delete Task',
  props<{ boardId: number; taskId: number }>(),
);
export const deleteTaskSuccess = createAction(
  '[Boards API] Delete Task Success',
  props<{ boardId: number; taskId: number }>(),
);
export const deleteTaskFailure = createAction(
  '[Boards API] Delete Task Failure',
  props<{ error: string }>(),
);

export const clearBoardsError = createAction('[Boards Page] Clear Error');

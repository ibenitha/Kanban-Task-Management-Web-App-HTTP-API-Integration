import { createAction, props } from '@ngrx/store';
import { Board } from '../../../core/models/board.model';
import { Task } from '../../../core/models/task.model';

/*
 * Actions describe events that happen in the application.
 * They do not call services or update the Store themselves.
 *
 * Asynchronous operations follow this pattern:
 *
 * Request action → Effect calls API → Success or Failure action
 *
 * The text inside brackets identifies where the action originated:
 * [Boards Page], [Task Form], or [Boards API].
 */

/*
 * LOAD BOARD DATA
 *
 * A board page dispatches the request action. The Effect loads both
 * collections and then dispatches either success or failure.
 */

// No payload is required because this requests all boards and tasks.
export const loadBoardData = createAction(
  '[Boards Page] Load Board Data',
);

// Success carries the data that the reducer will place in the Store.
export const loadBoardDataSuccess = createAction(
  '[Boards API] Load Board Data Success',
  props<{ boards: Board[]; tasks: Task[] }>(),
);

// Failure carries the message that the reducer will store.
export const loadBoardDataFailure = createAction(
  '[Boards API] Load Board Data Failure',
  props<{ error: string }>(),
);

/*
 * ADD BOARD
 *
 * The request contains form values. The success action contains the
 * complete board returned by the API (POST /boards), including its generated ID.
 */
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

/*
 * ADD TASK
 *
 * The form supplies every task property except ID. The API (POST /tasks) generates
 * the ID and returns the complete Task in the success action.
 */
export const addTask = createAction(
  '[Task Form] Add Task',
  props<{ task: Omit<Task, 'id'> }>(),
);

export const addTaskSuccess = createAction(
  '[Boards API] Add Task Success',
  props<{ task: Task }>(),
);

export const addTaskFailure = createAction(
  '[Boards API] Add Task Failure',
  props<{ error: string }>(),
);

/*
 * UPDATE TASK
 *
 * HTTP LAB: carries the complete edited Task because the API uses PUT,
 * which replaces the whole record on the server.
 */
export const updateTask = createAction(
  '[Task Form] Update Task',
  props<{ task: Task }>(),
);

// The API returns the complete updated task for the reducer to replace.
export const updateTaskSuccess = createAction(
  '[Boards API] Update Task Success',
  props<{ task: Task }>(),
);

export const updateTaskFailure = createAction(
  '[Boards API] Update Task Failure',
  props<{ error: string }>(),
);

/*
 * DELETE TASK
 *
 * The request and success actions carry the IDs because a delete operation
 * does not need to return a complete Task object.
 */
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

/*
 * DELETE BOARD (HTTP LAB)
 *
 * Dispatched from the board list after the user confirms. The Effect
 * deletes the board's tasks, then the board itself.
 */
export const deleteBoard = createAction(
  '[Boards Page] Delete Board',
  props<{ boardId: number }>(),
);

export const deleteBoardSuccess = createAction(
  '[Boards API] Delete Board Success',
  props<{ boardId: number }>(),
);

export const deleteBoardFailure = createAction(
  '[Boards API] Delete Board Failure',
  props<{ error: string }>(),
);

/*
 * This synchronous UI action tells the reducer to remove the current error.
 * It needs no payload, API request, or Effect.
 */
export const clearBoardsError = createAction(
  '[Boards Page] Clear Error',
);

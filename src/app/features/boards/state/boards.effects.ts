import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  concatMap,
  exhaustMap,
  filter,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';

import { BoardService } from '../../../core/services/board/board.service';
import { TaskService } from '../../../core/services/task/task.service';
import { NotificationService } from '../../../core/services/notification/notification.service';
import * as BoardsActions from './boards.actions';
import { selectAllTasks, selectBoardsLoaded } from './boards.selectors';

/*
 * Effects handle side effects such as API calls, navigation, and
 * notifications. They listen for actions and normally return new actions
 * that tell the reducer whether an operation succeeded or failed.
 *
 * HTTP LAB: this is the ONLY place that calls BoardService / TaskService.
 * Components just dispatch actions and read selectors, so they never know
 * whether data comes from json-server, the in-memory API, or a real backend.
 */
@Injectable()
export class BoardsEffects {
  // Actions$ is a stream containing every action dispatched in the app.
  private actions$ = inject(Actions);

  // The Store is read here to check the cache and find a board's tasks.
  private store = inject(Store);

  // HTTP data services (one per resource).
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);

  // Notifications and routing are also side effects handled by this class.
  private notifications = inject(NotificationService);
  private router = inject(Router);

  /*
   * INITIAL DATA LOAD — GET /boards and GET /tasks
   *
   * 1. filter(): skip the HTTP calls if the data is already cached in the
   *    Store. Every board page dispatches loadBoardData, but the API is
   *    only called once per app session.
   * 2. exhaustMap: ignore new load requests while one is still running.
   * 3. forkJoin: send both GET requests in parallel and wait for both.
   */
  loadBoardData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.loadBoardData),
      withLatestFrom(this.store.select(selectBoardsLoaded)),
      filter(([, loaded]) => !loaded),
      exhaustMap(() =>
        forkJoin({
          boards: this.boardService.getBoards(),
          tasks: this.taskService.getTasks(),
        }).pipe(
          map(({ boards, tasks }) => BoardsActions.loadBoardDataSuccess({ boards, tasks })),
          catchError((error: string) => of(BoardsActions.loadBoardDataFailure({ error }))),
        ),
      ),
    ),
  );

  /*
   * CREATE BOARD — POST /boards
   *
   * concatMap processes write operations in the order they were dispatched.
   * The service result becomes either addBoardSuccess or addBoardFailure.
   */
  addBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.addBoard),
      concatMap(({ name, description }) =>
        this.boardService.createBoard(name, description).pipe(
          map((board) => BoardsActions.addBoardSuccess({ board })),
          catchError((error: string) => of(BoardsActions.addBoardFailure({ error }))),
        ),
      ),
    ),
  );

  /*
   * DELETE BOARD — DELETE /tasks/:id (for each task), then DELETE /boards/:id
   *
   * The board's tasks are deleted first so no orphaned tasks are left on
   * the server. forkJoin runs those deletes in parallel; of([]) covers a
   * board with no tasks (forkJoin of an empty array would never emit).
   */
  deleteBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.deleteBoard),
      withLatestFrom(this.store.select(selectAllTasks)),
      concatMap(([{ boardId }, tasks]) => {
        const taskDeletes = tasks
          .filter((task) => task.boardId === boardId)
          .map((task) => this.taskService.deleteTask(task.id));

        return (taskDeletes.length ? forkJoin(taskDeletes) : of([])).pipe(
          switchMap(() => this.boardService.deleteBoard(boardId)),
          map(() => BoardsActions.deleteBoardSuccess({ boardId })),
          catchError((error: string) => of(BoardsActions.deleteBoardFailure({ error }))),
        );
      }),
    ),
  );

  /*
   * CREATE TASK — POST /tasks
   *
   * The component only dispatches addTask. This Effect performs the
   * asynchronous operation and sends the result to the reducer.
   */
  addTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.addTask),
      concatMap(({ task }) =>
        this.taskService.createTask(task).pipe(
          map((added) => BoardsActions.addTaskSuccess({ task: added })),
          catchError((error: string) => of(BoardsActions.addTaskFailure({ error }))),
        ),
      ),
    ),
  );

  /*
   * UPDATE TASK — PUT /tasks/:id
   *
   * The server's response (not the form values) goes into the Store.
   */
  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.updateTask),
      concatMap(({ task }) =>
        this.taskService.updateTask(task).pipe(
          map((saved) => BoardsActions.updateTaskSuccess({ task: saved })),
          catchError((error: string) => of(BoardsActions.updateTaskFailure({ error }))),
        ),
      ),
    ),
  );

  /*
   * DELETE TASK — DELETE /tasks/:id
   *
   * The API returns no body after deletion, so the original IDs are placed
   * in the success action. The reducer uses taskId to remove the task.
   */
  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.deleteTask),
      concatMap(({ boardId, taskId }) =>
        this.taskService.deleteTask(taskId).pipe(
          map(() => BoardsActions.deleteTaskSuccess({ boardId, taskId })),
          catchError((error: string) => of(BoardsActions.deleteTaskFailure({ error }))),
        ),
      ),
    ),
  );

  /*
   * NAVIGATION EFFECTS
   *
   * Navigation happens only after a successful operation. These Effects
   * use dispatch: false because router.navigate() does not produce another
   * NgRx action.
   */

  navigateAfterAddBoard$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardsActions.addBoardSuccess),
        tap(({ board }) => this.router.navigate(['/boards', board.id])),
      ),
    { dispatch: false },
  );

  navigateAfterAddTask$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardsActions.addTaskSuccess),
        tap(({ task }) => this.router.navigate(['/boards', task.boardId, 'overview'])),
      ),
    { dispatch: false },
  );

  navigateAfterDeleteTask$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardsActions.deleteTaskSuccess),
        tap(({ boardId }) => this.router.navigate(['/boards', boardId, 'overview'])),
      ),
    { dispatch: false },
  );

  /*
   * NOTIFICATION EFFECTS
   *
   * One shared BehaviorSubject-based service displays the result of every
   * operation. Keeping this here prevents components from repeating toast
   * logic.
   */

  notifyOnSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          BoardsActions.addBoardSuccess,
          BoardsActions.deleteBoardSuccess,
          BoardsActions.addTaskSuccess,
          BoardsActions.updateTaskSuccess,
          BoardsActions.deleteTaskSuccess,
        ),
        tap((action) => this.notifications.success(successMessageFor(action.type))),
      ),
    { dispatch: false },
  );

  // After a successful (re)load — e.g. the user clicked Retry — remove any
  // stale "server unreachable" toast that is still on screen.
  clearErrorToastOnLoad$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BoardsActions.loadBoardDataSuccess),
        tap(() => this.notifications.clear()),
      ),
    { dispatch: false },
  );

  // The error text comes from handleHttpError() in core/api/http-error.ts.
  notifyOnFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          BoardsActions.loadBoardDataFailure,
          BoardsActions.addBoardFailure,
          BoardsActions.deleteBoardFailure,
          BoardsActions.addTaskFailure,
          BoardsActions.updateTaskFailure,
          BoardsActions.deleteTaskFailure,
        ),
        tap(({ error }) => this.notifications.error(error)),
      ),
    { dispatch: false },
  );
}

/*
 * Converts successful action types into user-friendly toast messages.
 * This keeps message-selection logic out of the Effect pipeline.
 */
function successMessageFor(actionType: string): string {
  switch (actionType) {
    case BoardsActions.addBoardSuccess.type:
      return 'Board created.';

    case BoardsActions.deleteBoardSuccess.type:
      return 'Board deleted.';

    case BoardsActions.addTaskSuccess.type:
      return 'Task added.';

    case BoardsActions.updateTaskSuccess.type:
      return 'Task saved.';

    case BoardsActions.deleteTaskSuccess.type:
      return 'Task deleted.';

    default:
      return 'Done.';
  }
}

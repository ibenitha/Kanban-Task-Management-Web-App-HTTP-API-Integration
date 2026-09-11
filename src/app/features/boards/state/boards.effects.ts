import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, concatMap, exhaustMap, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { BoardService } from '../../../core/services/board/board.service';
import { NotificationService } from '../../../core/services/notification/notification.service';
import * as BoardsActions from './boards.actions';
import { selectAllBoards, selectAllTasks } from './boards.selectors';

// Effects are where async work happens: they listen for a request action,
// call the (simulated) API through BoardService, and turn the result into a
// success or failure action — the reducer never sees BoardService at all.
@Injectable()
export class BoardsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private boardService = inject(BoardService);
  private notifications = inject(NotificationService);
  private router = inject(Router);

  // exhaustMap ignores a repeated "load" dispatch while one is already in
  // flight (several pages can each dispatch loadBoardData on init). If
  // boards are already cached in the store, this resolves immediately
  // instead of calling the mock API a second time.
  loadBoardData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.loadBoardData),
      withLatestFrom(this.store.select(selectAllBoards), this.store.select(selectAllTasks)),
      exhaustMap(([, boards, tasks]) =>
        boards.length > 0
          ? of(BoardsActions.loadBoardDataSuccess({ boards, tasks }))
          : this.boardService.loadBoards().pipe(
              switchMap((loadedBoards) =>
                this.boardService
                  .loadTasks()
                  .pipe(map((loadedTasks) => ({ boards: loadedBoards, tasks: loadedTasks }))),
              ),
              map(({ boards: loadedBoards, tasks: loadedTasks }) =>
                BoardsActions.loadBoardDataSuccess({ boards: loadedBoards, tasks: loadedTasks }),
              ),
              catchError(() =>
                of(
                  BoardsActions.loadBoardDataFailure({
                    error: 'Could not load boards. Please try again.',
                  }),
                ),
              ),
            ),
      ),
    ),
  );

  // concatMap preserves order for user-triggered writes: if two mutations
  // fire close together they still reach the mock API — and update state —
  // in the order the user triggered them.
  addBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.addBoard),
      concatMap(({ name, description }) =>
        this.boardService.addBoard$(name, description).pipe(
          map((board) => BoardsActions.addBoardSuccess({ board })),
          catchError((error: string) => of(BoardsActions.addBoardFailure({ error }))),
        ),
      ),
    ),
  );

  addTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.addTask),
      concatMap(({ task }) =>
        this.boardService.addTask$(task).pipe(
          map((added) => BoardsActions.addTaskSuccess({ task: added })),
          catchError((error: string) => of(BoardsActions.addTaskFailure({ error }))),
        ),
      ),
    ),
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.updateTask),
      concatMap(({ boardId, taskId, changes }) =>
        this.boardService.updateTask$(boardId, taskId, changes).pipe(
          map((task) => BoardsActions.updateTaskSuccess({ task })),
          catchError((error: string) => of(BoardsActions.updateTaskFailure({ error }))),
        ),
      ),
    ),
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardsActions.deleteTask),
      concatMap(({ boardId, taskId }) =>
        this.boardService.deleteTask$(boardId, taskId).pipe(
          map(() => BoardsActions.deleteTaskSuccess({ boardId, taskId })),
          catchError((error: string) => of(BoardsActions.deleteTaskFailure({ error }))),
        ),
      ),
    ),
  );

  // Navigation is a side effect, not a state change — these never dispatch.
  // The id of a newly created board/task doesn't exist until the mock API
  // responds, so the component can't navigate itself; it waits here instead.
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

  // One shared notification service reacts to every mutation's outcome, so
  // each feature effect above doesn't need its own toast-handling code.
  notifyOnSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          BoardsActions.addBoardSuccess,
          BoardsActions.addTaskSuccess,
          BoardsActions.updateTaskSuccess,
          BoardsActions.deleteTaskSuccess,
        ),
        tap((action) => this.notifications.success(successMessageFor(action.type))),
      ),
    { dispatch: false },
  );

  notifyOnFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          BoardsActions.loadBoardDataFailure,
          BoardsActions.addBoardFailure,
          BoardsActions.addTaskFailure,
          BoardsActions.updateTaskFailure,
          BoardsActions.deleteTaskFailure,
        ),
        tap(({ error }) => this.notifications.error(error)),
      ),
    { dispatch: false },
  );
}

function successMessageFor(actionType: string): string {
  switch (actionType) {
    case BoardsActions.addBoardSuccess.type:
      return 'Board created.';
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

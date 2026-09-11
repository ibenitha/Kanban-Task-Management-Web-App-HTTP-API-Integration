import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { firstValueFrom, of, ReplaySubject, throwError } from 'rxjs';
import { Board } from '../../../core/models/board.model';
import { Task } from '../../../core/models/task.model';
import { BoardService } from '../../../core/services/board/board.service';
import { NotificationService } from '../../../core/services/notification/notification.service';
import * as BoardsActions from './boards.actions';
import { BoardsEffects } from './boards.effects';
import { selectAllBoards, selectAllTasks } from './boards.selectors';
import { boardsFeatureKey, initialBoardsState } from './boards.state';

const board: Board = {
  id: 1,
  name: 'Board',
  description: '',
  accent: '#000',
  members: [],
  updatedAt: 0,
};

const task: Task = {
  id: 1,
  boardId: 1,
  title: 'Task',
  description: '',
  status: 'todo',
  priority: 'low',
  assignee: '',
  dueDate: '',
  tags: [],
};

type BoardServiceStub = {
  [K in 'loadBoards' | 'loadTasks' | 'addBoard$' | 'addTask$' | 'updateTask$' | 'deleteTask$']: ReturnType<
    typeof vi.fn
  >;
};

describe('BoardsEffects', () => {
  let actions$: ReplaySubject<unknown>;
  let effects: BoardsEffects;
  let boardService: BoardServiceStub;
  let notifications: NotificationService;
  let router: Router;

  function setup() {
    actions$ = new ReplaySubject(1);

    const boardServiceStub: BoardServiceStub = {
      loadBoards: vi.fn(),
      loadTasks: vi.fn(),
      addBoard$: vi.fn(),
      addTask$: vi.fn(),
      updateTask$: vi.fn(),
      deleteTask$: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        BoardsEffects,
        provideRouter([]),
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: { [boardsFeatureKey]: initialBoardsState },
        }),
        { provide: BoardService, useValue: boardServiceStub },
      ],
    });

    effects = TestBed.inject(BoardsEffects);
    boardService = boardServiceStub;
    notifications = TestBed.inject(NotificationService);
    router = TestBed.inject(Router);
  }

  beforeEach(() => setup());

  // overrideSelector() mutates the shared, module-level selector function
  // itself (selectAllBoards/selectAllTasks), not just this test's store —
  // without resetting it here, an override would leak into the next test.
  afterEach(() => {
    TestBed.inject(MockStore).resetSelectors();
  });

  it('loadBoardData$ calls the API and dispatches success when the store is empty', async () => {
    boardService.loadBoards.mockReturnValue(of([board]));
    boardService.loadTasks.mockReturnValue(of([task]));

    actions$.next(BoardsActions.loadBoardData());
    const result = await firstValueFrom(effects.loadBoardData$);

    expect(result).toEqual(BoardsActions.loadBoardDataSuccess({ boards: [board], tasks: [task] }));
    expect(boardService.loadBoards).toHaveBeenCalled();
  });

  it('loadBoardData$ resolves from the cache without calling the API when boards already exist', async () => {
    const store = TestBed.inject(MockStore);
    store.overrideSelector(selectAllBoards, [board]);
    store.overrideSelector(selectAllTasks, [task]);
    store.refreshState();

    actions$.next(BoardsActions.loadBoardData());
    const result = await firstValueFrom(effects.loadBoardData$);

    expect(result).toEqual(BoardsActions.loadBoardDataSuccess({ boards: [board], tasks: [task] }));
    expect(boardService.loadBoards).not.toHaveBeenCalled();
  });

  it('loadBoardData$ dispatches a failure action when the API errors', async () => {
    boardService.loadBoards.mockReturnValue(throwError(() => 'network down'));

    actions$.next(BoardsActions.loadBoardData());
    const result = await firstValueFrom(effects.loadBoardData$);

    expect(result).toEqual(
      BoardsActions.loadBoardDataFailure({ error: 'Could not load boards. Please try again.' }),
    );
  });

  it('addTask$ dispatches addTaskSuccess on success', async () => {
    boardService.addTask$.mockReturnValue(of(task));

    actions$.next(BoardsActions.addTask({ task }));
    const result = await firstValueFrom(effects.addTask$);

    expect(result).toEqual(BoardsActions.addTaskSuccess({ task }));
  });

  it('addTask$ dispatches addTaskFailure on error', async () => {
    boardService.addTask$.mockReturnValue(throwError(() => 'Task title is required.'));

    actions$.next(BoardsActions.addTask({ task }));
    const result = await firstValueFrom(effects.addTask$);

    expect(result).toEqual(BoardsActions.addTaskFailure({ error: 'Task title is required.' }));
  });

  it('updateTask$ dispatches updateTaskSuccess on success', async () => {
    boardService.updateTask$.mockReturnValue(of(task));

    actions$.next(BoardsActions.updateTask({ boardId: 1, taskId: 1, changes: {} }));
    const result = await firstValueFrom(effects.updateTask$);

    expect(result).toEqual(BoardsActions.updateTaskSuccess({ task }));
  });

  it('deleteTask$ dispatches deleteTaskSuccess on success', async () => {
    boardService.deleteTask$.mockReturnValue(of(undefined));

    actions$.next(BoardsActions.deleteTask({ boardId: 1, taskId: 1 }));
    const result = await firstValueFrom(effects.deleteTask$);

    expect(result).toEqual(BoardsActions.deleteTaskSuccess({ boardId: 1, taskId: 1 }));
  });

  it('navigateAfterAddBoard$ navigates to the new board without dispatching', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');

    actions$.next(BoardsActions.addBoardSuccess({ board }));
    await firstValueFrom(effects.navigateAfterAddBoard$);

    expect(navigateSpy).toHaveBeenCalledWith(['/boards', board.id]);
  });

  it('notifyOnSuccess$ tells the notification service about a successful mutation', async () => {
    const successSpy = vi.spyOn(notifications, 'success');

    actions$.next(BoardsActions.updateTaskSuccess({ task }));
    await firstValueFrom(effects.notifyOnSuccess$);

    expect(successSpy).toHaveBeenCalledWith('Task saved.');
  });

  it('notifyOnFailure$ tells the notification service about a failed mutation', async () => {
    const errorSpy = vi.spyOn(notifications, 'error');

    actions$.next(BoardsActions.updateTaskFailure({ error: 'That task no longer exists.' }));
    await firstValueFrom(effects.notifyOnFailure$);

    expect(errorSpy).toHaveBeenCalledWith('That task no longer exists.');
  });
});

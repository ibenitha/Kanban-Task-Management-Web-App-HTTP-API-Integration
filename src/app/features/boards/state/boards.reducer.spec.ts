import { Board } from '../../../core/models/board.model';
import { Task } from '../../../core/models/task.model';
import * as BoardsActions from './boards.actions';
import { boardsReducer } from './boards.reducer';
import { BoardsState, initialBoardsState } from './boards.state';

const board: Board = {
  id: 1,
  name: 'Test Board',
  description: 'desc',
  accent: '#000',
  members: [],
  updatedAt: 0,
};

const task: Task = {
  id: 1,
  boardId: 1,
  title: 'Task one',
  description: '',
  status: 'todo',
  priority: 'low',
  assignee: '',
  dueDate: '',
  tags: [],
};

describe('boardsReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = boardsReducer(undefined, { type: 'noop' });
    expect(state).toEqual(initialBoardsState);
  });

  it('sets loading and clears any stale error when a load starts', () => {
    const start: BoardsState = { ...initialBoardsState, error: 'old error' };
    const state = boardsReducer(start, BoardsActions.loadBoardData());
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('stores boards and tasks on load success and clears loading', () => {
    const start: BoardsState = { ...initialBoardsState, loading: true };
    const state = boardsReducer(
      start,
      BoardsActions.loadBoardDataSuccess({ boards: [board], tasks: [task] }),
    );
    expect(state.boards).toEqual([board]);
    expect(state.tasks).toEqual([task]);
    expect(state.loading).toBe(false);
  });

  it('stores a friendly error and clears loading on load failure', () => {
    const start: BoardsState = { ...initialBoardsState, loading: true };
    const state = boardsReducer(
      start,
      BoardsActions.loadBoardDataFailure({ error: 'Could not load boards.' }),
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Could not load boards.');
  });

  it('adds a board immutably on addBoardSuccess', () => {
    const start: BoardsState = { ...initialBoardsState, boards: [board] };
    const newBoard: Board = { ...board, id: 2, name: 'Second' };
    const state = boardsReducer(start, BoardsActions.addBoardSuccess({ board: newBoard }));

    expect(state.boards).toEqual([board, newBoard]);
    expect(state.boards).not.toBe(start.boards); // new array reference
    expect(start.boards).toEqual([board]); // original untouched
  });

  it('adds a task immutably on addTaskSuccess', () => {
    const start: BoardsState = { ...initialBoardsState, tasks: [task] };
    const newTask: Task = { ...task, id: 2, title: 'Task two' };
    const state = boardsReducer(start, BoardsActions.addTaskSuccess({ task: newTask }));

    expect(state.tasks).toEqual([task, newTask]);
    expect(start.tasks).toEqual([task]);
  });

  it('replaces only the matching task on updateTaskSuccess', () => {
    const otherTask: Task = { ...task, id: 2, title: 'Untouched' };
    const start: BoardsState = { ...initialBoardsState, tasks: [task, otherTask] };
    const updated: Task = { ...task, title: 'Updated title' };

    const state = boardsReducer(start, BoardsActions.updateTaskSuccess({ task: updated }));

    expect(state.tasks.find((t) => t.id === 1)?.title).toBe('Updated title');
    expect(state.tasks.find((t) => t.id === 2)).toBe(otherTask); // reference preserved
  });

  it('removes only the matching task on deleteTaskSuccess', () => {
    const otherTask: Task = { ...task, id: 2 };
    const start: BoardsState = { ...initialBoardsState, tasks: [task, otherTask] };

    const state = boardsReducer(
      start,
      BoardsActions.deleteTaskSuccess({ boardId: 1, taskId: 1 }),
    );

    expect(state.tasks).toEqual([otherTask]);
  });

  it('clears the error on clearBoardsError without touching other fields', () => {
    const start: BoardsState = { ...initialBoardsState, error: 'oops', boards: [board] };
    const state = boardsReducer(start, BoardsActions.clearBoardsError());
    expect(state.error).toBeNull();
    expect(state.boards).toEqual([board]);
  });
});

import { Board } from '../../../core/models/board.model';
import { Task } from '../../../core/models/task.model';
import * as BoardsSelectors from './boards.selectors';
import { BoardsState, boardsFeatureKey, initialBoardsState } from './boards.state';

const boards: Board[] = [
  { id: 1, name: 'Alpha', description: 'first', accent: '#000', members: [], updatedAt: 100 },
  { id: 2, name: 'Beta', description: 'second', accent: '#000', members: [], updatedAt: 200 },
];

const tasks: Task[] = [
  { id: 1, boardId: 1, title: 'A', description: '', status: 'todo', priority: 'low', assignee: '', dueDate: '', tags: [] },
  { id: 2, boardId: 1, title: 'B', description: '', status: 'completed', priority: 'low', assignee: '', dueDate: '', tags: [] },
  { id: 3, boardId: 2, title: 'C', description: '', status: 'completed', priority: 'low', assignee: '', dueDate: '', tags: [] },
];

function buildState(overrides: Partial<BoardsState> = {}): { [boardsFeatureKey]: BoardsState } {
  return { [boardsFeatureKey]: { ...initialBoardsState, boards, tasks, ...overrides } };
}

describe('boards selectors', () => {
  it('selectAllBoards / selectAllTasks return the raw collections', () => {
    const state = buildState();
    expect(BoardsSelectors.selectAllBoards(state)).toEqual(boards);
    expect(BoardsSelectors.selectAllTasks(state)).toEqual(tasks);
  });

  it('selectBoardsLoading / selectBoardsError read the flags', () => {
    const state = buildState({ loading: true, error: 'oops' });
    expect(BoardsSelectors.selectBoardsLoading(state)).toBe(true);
    expect(BoardsSelectors.selectBoardsError(state)).toBe('oops');
  });

  it('selectBoardById finds a board or returns undefined', () => {
    const state = buildState();
    expect(BoardsSelectors.selectBoardById(1)(state)?.name).toBe('Alpha');
    expect(BoardsSelectors.selectBoardById(999)(state)).toBeUndefined();
  });

  it('selectTaskByBoardAndId scopes to both ids', () => {
    const state = buildState();
    expect(BoardsSelectors.selectTaskByBoardAndId(1, 1)(state)?.title).toBe('A');
    expect(BoardsSelectors.selectTaskByBoardAndId(2, 1)(state)).toBeUndefined(); // wrong board
  });

  it('selectTasksForBoard scopes to a board, and optionally a status', () => {
    const state = buildState();
    const allForBoard1 = BoardsSelectors.selectTasksForBoard(1)(state);
    expect(allForBoard1.map((t) => t.id)).toEqual([1, 2]);

    const completedForBoard1 = BoardsSelectors.selectTasksForBoard(1, 'completed')(state);
    expect(completedForBoard1.map((t) => t.id)).toEqual([2]);
  });

  it('selectBoardProgress derives completed/total/status from tasks', () => {
    const state = buildState();
    expect(BoardsSelectors.selectBoardProgress(1)(state)).toEqual({
      completed: 1,
      total: 2,
      status: 'active',
    });
    expect(BoardsSelectors.selectBoardProgress(2)(state)).toEqual({
      completed: 1,
      total: 1,
      status: 'completed',
    });
  });

  it('selectFilteredBoardSummaries searches by name/description', () => {
    const state = buildState();
    const results = BoardsSelectors.selectFilteredBoardSummaries({ search: 'beta' })(state);
    expect(results.map((r) => r.board.id)).toEqual([2]);
  });

  it('selectFilteredBoardSummaries filters by derived progress status', () => {
    const state = buildState();
    const completedOnly = BoardsSelectors.selectFilteredBoardSummaries({ filter: 'completed' })(
      state,
    );
    expect(completedOnly.map((r) => r.board.id)).toEqual([2]);
  });

  it('selectFilteredBoardSummaries sorts by name or by most recently updated', () => {
    const state = buildState();
    const byName = BoardsSelectors.selectFilteredBoardSummaries({ sort: 'name' })(state);
    expect(byName.map((r) => r.board.name)).toEqual(['Alpha', 'Beta']);

    const byRecent = BoardsSelectors.selectFilteredBoardSummaries({ sort: 'recent' })(state);
    expect(byRecent.map((r) => r.board.name)).toEqual(['Beta', 'Alpha']); // higher updatedAt first
  });
});

import { TestBed } from '@angular/core/testing';
import { BoardService } from './board.service';

describe('BoardService', () => {
  let service: BoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('finds a board by id', () => {
    expect(service.getBoard(1)?.name).toBe('Website Redesign');
  });

  it('returns undefined for an unknown board id', () => {
    expect(service.getBoard(999)).toBeUndefined();
  });

  it('filters boards by search text across name and description', () => {
    expect(service.getBoards({ search: 'mobile' }).map((b) => b.id)).toEqual([2]);
    expect(
      service
        .getBoards({ search: 'launch' })
        .map((b) => b.id)
        .sort(),
    ).toEqual([1, 3]);
  });

  it('sorts boards by name or by most recently updated', () => {
    const byName = service.getBoards({ sort: 'name' }).map((b) => b.name);
    expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b)));

    const byRecent = service.getBoards({ sort: 'recent' });
    expect(byRecent[0].name).toBe('Website Redesign'); // seeded as the most recently updated
  });

  it('filters boards by derived progress status', () => {
    for (const board of service.getBoards({ filter: 'active' })) {
      expect(service.getBoardProgress(board.id).status).toBe('active');
    }
  });

  it('adds a board and makes it immediately findable', () => {
    const board = service.addBoard('New Board', 'Created in a test');
    expect(service.getBoard(board.id)).toEqual(board);
  });

  it('scopes tasks to their board, and optionally to one column', () => {
    const allTasks = service.getTasksForBoard(1);
    expect(allTasks.every((task) => task.boardId === 1)).toBe(true);

    const todoTasks = service.getTasksForBoard(1, 'todo');
    expect(todoTasks.every((task) => task.status === 'todo')).toBe(true);
    expect(todoTasks.length).toBeLessThan(allTasks.length);
  });

  it('updates a task in place', () => {
    service.updateTask(1, 1, { title: 'Renamed task' });
    expect(service.getTask(1, 1)?.title).toBe('Renamed task');
  });

  it('exposes the four fixed Kanban columns', () => {
    expect(service.getColumns().map((c) => c.id)).toEqual([
      'todo',
      'in-progress',
      'review',
      'completed',
    ]);
  });
});

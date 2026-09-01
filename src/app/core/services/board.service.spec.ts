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

  it('sorts boards by name or by most recently created', () => {
    const byName = service.getBoards('name').map((b) => b.name);
    expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b)));

    const byRecent = service.getBoards('recent');
    expect(byRecent[0].name).toBe('Marketing Campaign'); // seeded as the newest
  });

  it('adds a board and makes it immediately findable', () => {
    const board = service.addBoard('New Board', 'A board created in a test');
    expect(service.getBoard(board.id)).toEqual(board);
  });

  it('computes prev/next board ids in stable id order', () => {
    expect(service.getAdjacentBoardIds(1)).toEqual({ prevId: null, nextId: 2 });
    expect(service.getAdjacentBoardIds(2)).toEqual({ prevId: 1, nextId: 3 });
    expect(service.getAdjacentBoardIds(3)).toEqual({ prevId: 2, nextId: null });
  });

  it('updates a task in place', () => {
    service.updateTask(1, 1, { title: 'Renamed task' });
    expect(service.getTask(1, 1)?.title).toBe('Renamed task');
  });
});

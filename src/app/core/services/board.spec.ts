import { TestBed } from '@angular/core/testing';
import { BoardService } from './board';

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
    const board = service.getBoardById('website-redesign');
    expect(board?.name).toBe('Website Redesign');
  });

  it('returns undefined for an unknown board id', () => {
    expect(service.getBoardById('does-not-exist')).toBeUndefined();
  });
});

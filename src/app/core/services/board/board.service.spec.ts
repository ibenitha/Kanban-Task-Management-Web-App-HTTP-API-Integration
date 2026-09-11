import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
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

  it('loads the seeded boards asynchronously', async () => {
    const boards = await firstValueFrom(service.loadBoards());
    expect(boards.find((b) => b.id === 1)?.name).toBe('Website Redesign');
  });

  it('loads the seeded tasks asynchronously, scoped to their board', async () => {
    const tasks = await firstValueFrom(service.loadTasks());
    const board1Tasks = tasks.filter((t) => t.boardId === 1);
    expect(board1Tasks.length).toBeGreaterThan(0);
    expect(board1Tasks.every((t) => t.boardId === 1)).toBe(true);
  });

  it('adds a board that is immediately included in a fresh load', async () => {
    const board = await firstValueFrom(service.addBoard$('New Board', 'Created in a test'));
    expect(board.name).toBe('New Board');

    const boards = await firstValueFrom(service.loadBoards());
    expect(boards.find((b) => b.id === board.id)).toEqual(board);
  });

  it('rejects an empty board name', async () => {
    await expect(firstValueFrom(service.addBoard$('   ', 'desc'))).rejects.toBe(
      'Board name is required.',
    );
  });

  it('adds a task that is immediately included in a fresh load', async () => {
    const task = await firstValueFrom(
      service.addTask$({
        boardId: 1,
        title: 'New task',
        description: '',
        status: 'todo',
        priority: 'low',
        assignee: '',
        dueDate: '',
        tags: [],
      }),
    );
    expect(task.title).toBe('New task');

    const tasks = await firstValueFrom(service.loadTasks());
    expect(tasks.find((t) => t.id === task.id)).toEqual(task);
  });

  it('rejects a task with an empty title', async () => {
    await expect(
      firstValueFrom(
        service.addTask$({
          boardId: 1,
          title: '   ',
          description: '',
          status: 'todo',
          priority: 'low',
          assignee: '',
          dueDate: '',
          tags: [],
        }),
      ),
    ).rejects.toBe('Task title is required.');
  });

  it('updates a task in place', async () => {
    const updated = await firstValueFrom(service.updateTask$(1, 1, { title: 'Renamed task' }));
    expect(updated.title).toBe('Renamed task');

    const tasks = await firstValueFrom(service.loadTasks());
    expect(tasks.find((t) => t.id === 1)?.title).toBe('Renamed task');
  });

  it('rejects updating a task that does not exist', async () => {
    await expect(firstValueFrom(service.updateTask$(1, 999, { title: 'x' }))).rejects.toBe(
      'That task no longer exists.',
    );
  });

  it('deletes a task so it no longer appears in a fresh load', async () => {
    await firstValueFrom(service.deleteTask$(1, 1));
    const tasks = await firstValueFrom(service.loadTasks());
    expect(tasks.find((t) => t.id === 1)).toBeUndefined();
  });

  it('rejects deleting a task that does not exist', async () => {
    await expect(firstValueFrom(service.deleteTask$(1, 999))).rejects.toBe(
      'That task no longer exists.',
    );
  });

  it('exposes the four fixed Kanban columns', () => {
    expect(service.getColumns().map((c) => c.id)).toEqual([
      'todo',
      'in-progress',
      'review',
      'completed',
    ]);
  });

  it('looks up a single column by id', () => {
    expect(service.getColumn('todo')?.name).toBe('To Do');
    expect(service.getColumn('made-up')).toBeUndefined();
  });
});

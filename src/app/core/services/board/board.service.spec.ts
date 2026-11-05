import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from '../../api/api.config';
import { Board } from '../../models/board.model';
import { BoardService } from './board.service';

const board: Board = {
  id: 1,
  name: 'Website Redesign',
  description: '',
  accent: '#2563eb',
  members: [],
  updatedAt: 0,
};

// HttpTestingController intercepts requests, so these tests check the exact
// HTTP method, URL and body without needing a running server.
describe('BoardService', () => {
  let service: BoardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BoardService);
    http = TestBed.inject(HttpTestingController);
  });

  // Fails the test if any request was sent that the test did not expect.
  afterEach(() => http.verify());

  it('getBoards() sends GET /boards and returns the boards', async () => {
    const result = firstValueFrom(service.getBoards());

    const req = http.expectOne(API_ENDPOINTS.boards);
    expect(req.request.method).toBe('GET');
    req.flush([board]);

    expect(await result).toEqual([board]);
  });

  it('getBoards() retries once, then reports a friendly error', async () => {
    const result = firstValueFrom(service.getBoards());

    // First attempt + one retry, both failing with "server unreachable".
    http.expectOne(API_ENDPOINTS.boards).error(new ProgressEvent('error'));
    http.expectOne(API_ENDPOINTS.boards).error(new ProgressEvent('error'));

    await expect(result).rejects.toBe(
      'Could not load boards. The server is unreachable — please try again.',
    );
  });

  it('createBoard() sends POST /boards with the trimmed form values', async () => {
    const result = firstValueFrom(service.createBoard('  New board  ', ' desc '));

    const req = http.expectOne(API_ENDPOINTS.boards);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(
      expect.objectContaining({ name: 'New board', description: 'desc' }),
    );
    // No id is sent — the server generates it.
    expect(req.request.body.id).toBeUndefined();
    req.flush({ ...board, id: 4, name: 'New board' });

    expect((await result).id).toBe(4);
  });

  it('deleteBoard() sends DELETE /boards/:id', async () => {
    const result = firstValueFrom(service.deleteBoard(1));

    const req = http.expectOne(`${API_ENDPOINTS.boards}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await result;
  });

  it('deleteBoard() reports a friendly error on 404', async () => {
    const result = firstValueFrom(service.deleteBoard(99));

    http
      .expectOne(`${API_ENDPOINTS.boards}/99`)
      .flush(null, { status: 404, statusText: 'Not Found' });

    await expect(result).rejects.toBe('Could not delete the board. It no longer exists on the server.');
  });
});

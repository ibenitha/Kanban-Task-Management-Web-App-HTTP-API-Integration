import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, retry } from 'rxjs';
import { API_ENDPOINTS } from '../../api/api.config';
import { handleHttpError } from '../../api/http-error';
import { Board } from '../../models/board.model';

/*
 * Data service for BOARDS. All board HTTP requests live here.
 *
 * - Components never call this service directly; NgRx Effects do
 *   (see features/boards/state/boards.effects.ts).
 * - Each method returns a cold Observable: nothing is sent until the
 *   Effect subscribes.
 * - Errors are converted to friendly messages by handleHttpError().
 */
@Injectable({ providedIn: 'root' })
export class BoardService {
  private http = inject(HttpClient);
  private url = API_ENDPOINTS.boards;

  // GET /boards
  // retry(1): a read is safe to repeat, so retry once on a network glitch
  // before reporting failure. Writes are NOT retried to avoid duplicates.
  getBoards(): Observable<Board[]> {
    return this.http
      .get<Board[]>(this.url)
      .pipe(retry(1), catchError(handleHttpError('load boards')));
  }

  // POST /boards — the server generates the id and returns the full board.
  createBoard(name: string, description: string): Observable<Board> {
    const newBoard: Omit<Board, 'id'> = {
      name: name.trim(),
      description: description.trim(),
      accent: '#2563eb',
      members: [],
      updatedAt: Date.now(),
    };

    return this.http
      .post<Board>(this.url, newBoard)
      .pipe(catchError(handleHttpError('create the board')));
  }

  // DELETE /boards/:id
  deleteBoard(boardId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.url}/${boardId}`)
      .pipe(catchError(handleHttpError('delete the board')));
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, retry } from 'rxjs';
import { API_ENDPOINTS } from '../../api/api.config';
import { handleHttpError } from '../../api/http-error';
import { Task } from '../../models/task.model';

/*
 * Data service for TASKS. All task HTTP requests live here.
 * Same rules as BoardService: called only from NgRx Effects, returns
 * Observables, and converts HTTP errors into friendly messages.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private url = API_ENDPOINTS.tasks;

  // GET /tasks — retried once, like BoardService.getBoards().
  getTasks(): Observable<Task[]> {
    return this.http
      .get<Task[]>(this.url)
      .pipe(retry(1), catchError(handleHttpError('load tasks')));
  }

  // POST /tasks — the "Add Task" form. The server assigns the id.
  createTask(task: Omit<Task, 'id'>): Observable<Task> {
    return this.http
      .post<Task>(this.url, task)
      .pipe(catchError(handleHttpError('add the task')));
  }

  // PUT /tasks/:id — the "Edit Task" form. PUT replaces the whole record,
  // so the full task is sent, and the server returns the saved version.
  updateTask(task: Task): Observable<Task> {
    return this.http
      .put<Task>(`${this.url}/${task.id}`, task)
      .pipe(catchError(handleHttpError('save the task')));
  }

  // DELETE /tasks/:id
  deleteTask(taskId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.url}/${taskId}`)
      .pipe(catchError(handleHttpError('delete the task')));
  }
}

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from '../../api/api.config';
import { Task } from '../../models/task.model';
import { TaskService } from './task.service';

const task: Task = {
  id: 1,
  boardId: 1,
  title: 'Design homepage hero',
  description: '',
  status: 'todo',
  priority: 'high',
  assignee: 'AK',
  dueDate: '2026-09-12',
  tags: ['design'],
};

// One test per HTTP verb: GET, POST, PUT, DELETE, plus error handling.
describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getTasks() sends GET /tasks', async () => {
    const result = firstValueFrom(service.getTasks());

    const req = http.expectOne(API_ENDPOINTS.tasks);
    expect(req.request.method).toBe('GET');
    req.flush([task]);

    expect(await result).toEqual([task]);
  });

  it('createTask() sends POST /tasks and returns the task with its new id', async () => {
    const { id, ...newTask } = task;
    const result = firstValueFrom(service.createTask(newTask));

    const req = http.expectOne(API_ENDPOINTS.tasks);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newTask);
    req.flush({ ...newTask, id: 14 });

    expect((await result).id).toBe(14);
  });

  it('updateTask() sends PUT /tasks/:id with the complete task', async () => {
    const edited = { ...task, title: 'Renamed' };
    const result = firstValueFrom(service.updateTask(edited));

    const req = http.expectOne(`${API_ENDPOINTS.tasks}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(edited);
    req.flush(edited);

    expect(await result).toEqual(edited);
  });

  it('deleteTask() sends DELETE /tasks/:id', async () => {
    const result = firstValueFrom(service.deleteTask(1));

    const req = http.expectOne(`${API_ENDPOINTS.tasks}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await result;
  });

  it('updateTask() turns a server error into a friendly message', async () => {
    const result = firstValueFrom(service.updateTask(task));

    http
      .expectOne(`${API_ENDPOINTS.tasks}/1`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    await expect(result).rejects.toBe(
      'Could not save the task. The server responded with error 500.',
    );
  });
});

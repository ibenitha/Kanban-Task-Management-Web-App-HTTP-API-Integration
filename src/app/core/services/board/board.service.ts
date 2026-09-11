import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Board } from '../../models/board.model';
import { Column } from '../../models/column.model';
import { Task } from '../../models/task.model';

// A stand-in for a real backend: every public data method below returns an
// Observable and simulates network latency with delay(), so NgRx Effects
// (in features/boards/state/boards.effects.ts) have genuine asynchronous
// work to orchestrate — a loading state that's actually visible, and a
// catchError path that actually has time to matter. NgRx owns the resulting
// application state; this service only owns the mock persistence layer.
const API_DELAY_MS = 300;

// The four Kanban columns are fixed configuration, not state that changes
// over time, so they stay a plain constant/service lookup rather than
// living in the store.
const COLUMNS: Column[] = [
  { id: 'todo', name: 'To Do' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'completed', name: 'Completed' },
];

@Injectable({ providedIn: 'root' })
export class BoardService {
  private boards: Board[] = [
    {
      id: 1,
      name: 'Website Redesign',
      description: 'Revamp the marketing site ahead of the Q4 launch.',
      accent: '#2563eb',
      members: ['AK', 'JM', 'RT'],
      updatedAt: Date.now() - 1 * 86_400_000,
    },
    {
      id: 2,
      name: 'Mobile App',
      description: 'Native iOS and Android task tracker.',
      accent: '#0f766e',
      members: ['SL', 'PD'],
      updatedAt: Date.now() - 3 * 86_400_000,
    },
    {
      id: 3,
      name: 'Marketing Campaign',
      description: 'Plan and launch the spring product campaign.',
      accent: '#b45309',
      members: ['JM', 'CO', 'AK'],
      updatedAt: Date.now() - 6 * 86_400_000,
    },
  ];

  private nextBoardId = 4;

  private tasks: Task[] = [
    // Website Redesign (board 1)
    {
      id: 1,
      boardId: 1,
      title: 'Design homepage hero',
      description: 'Explore three hero layout options for the new homepage.',
      status: 'todo',
      priority: 'high',
      assignee: 'AK',
      dueDate: '2026-09-12',
      tags: ['design'],
    },
    {
      id: 2,
      boardId: 1,
      title: 'Write new marketing copy',
      description: 'Refresh the headline and subheading text across the site.',
      status: 'todo',
      priority: 'medium',
      assignee: 'JM',
      dueDate: '2026-09-15',
      tags: ['content'],
    },
    {
      id: 3,
      boardId: 1,
      title: 'Build responsive navigation',
      description: 'Implement a responsive nav bar with a clear active state.',
      status: 'in-progress',
      priority: 'high',
      assignee: 'RT',
      dueDate: '2026-09-10',
      tags: ['frontend'],
    },
    {
      id: 4,
      boardId: 1,
      title: 'Accessibility pass on forms',
      description: 'Check labels, focus order and contrast on every form.',
      status: 'review',
      priority: 'medium',
      assignee: 'AK',
      dueDate: '2026-09-11',
      tags: ['a11y'],
    },
    {
      id: 5,
      boardId: 1,
      title: 'Set up analytics',
      description: 'Add page view and outbound link tracking.',
      status: 'completed',
      priority: 'low',
      assignee: 'RT',
      dueDate: '2026-09-01',
      tags: ['ops'],
    },
    {
      id: 6,
      boardId: 1,
      title: 'Cross-browser QA',
      description: 'Verify layout in the last two versions of major browsers.',
      status: 'completed',
      priority: 'medium',
      assignee: 'JM',
      dueDate: '2026-08-29',
      tags: ['qa'],
    },

    // Mobile App (board 2)
    {
      id: 7,
      boardId: 2,
      title: 'Design onboarding flow',
      description: 'Three-screen welcome carousel for first-time users.',
      status: 'todo',
      priority: 'medium',
      assignee: 'SL',
      dueDate: '2026-09-14',
      tags: ['design'],
    },
    {
      id: 8,
      boardId: 2,
      title: 'Offline task caching',
      description: 'Cache the task list locally so the app works offline.',
      status: 'todo',
      priority: 'high',
      assignee: 'PD',
      dueDate: '2026-09-20',
      tags: ['engineering'],
    },
    {
      id: 9,
      boardId: 2,
      title: 'Implement push notifications',
      description: 'Wire up reminders for tasks approaching their due date.',
      status: 'in-progress',
      priority: 'high',
      assignee: 'PD',
      dueDate: '2026-09-09',
      tags: ['engineering'],
    },
    {
      id: 10,
      boardId: 2,
      title: 'Beta tester feedback triage',
      description: 'Sort incoming TestFlight feedback into actionable issues.',
      status: 'review',
      priority: 'low',
      assignee: 'SL',
      dueDate: '2026-09-08',
      tags: ['research'],
    },

    // Marketing Campaign (board 3)
    {
      id: 11,
      boardId: 3,
      title: 'Draft social media posts',
      description: 'Write a week of launch-day posts across channels.',
      status: 'todo',
      priority: 'medium',
      assignee: 'CO',
      dueDate: '2026-09-18',
      tags: ['content'],
    },
    {
      id: 12,
      boardId: 3,
      title: 'Book influencer partnerships',
      description: 'Confirm two partnerships for the launch window.',
      status: 'in-progress',
      priority: 'medium',
      assignee: 'JM',
      dueDate: '2026-09-16',
      tags: ['partnerships'],
    },
    {
      id: 13,
      boardId: 3,
      title: 'Finalize campaign budget',
      description: 'Get sign-off on the spring campaign spend.',
      status: 'completed',
      priority: 'high',
      assignee: 'AK',
      dueDate: '2026-08-25',
      tags: ['budget'],
    },
  ];

  private nextTaskId = 14;

  getColumns(): Column[] {
    return COLUMNS;
  }

  getColumn(id: string): Column | undefined {
    return COLUMNS.find((column) => column.id === id);
  }

  // Every method below hands out a fresh copy, never the internal record
  // itself. NgRx deep-freezes state in dev mode to catch accidental
  // mutation — if a component's edit dispatched the exact same object this
  // service still holds, that freeze would make this "database" read-only
  // forever. A real HTTP response would be a deserialized copy for the
  // same reason; this mock keeps that same boundary.
  loadBoards(): Observable<Board[]> {
    return of(this.boards.map((board) => ({ ...board }))).pipe(delay(API_DELAY_MS));
  }

  loadTasks(): Observable<Task[]> {
    return of(this.tasks.map((task) => this.cloneTask(task))).pipe(delay(API_DELAY_MS));
  }

  addBoard$(name: string, description: string): Observable<Board> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return throwError(() => 'Board name is required.').pipe(delay(API_DELAY_MS));
    }

    const board: Board = {
      id: this.nextBoardId++,
      name: trimmedName,
      description: description.trim(),
      accent: '#2563eb',
      members: [],
      updatedAt: Date.now(),
    };
    this.boards.push(board);
    return of({ ...board }).pipe(delay(API_DELAY_MS));
  }

  addTask$(task: Omit<Task, 'id'>): Observable<Task> {
    if (!task.title.trim()) {
      return throwError(() => 'Task title is required.').pipe(delay(API_DELAY_MS));
    }

    const newTask: Task = { ...task, id: this.nextTaskId++ };
    this.tasks.push(newTask);
    return of(this.cloneTask(newTask)).pipe(delay(API_DELAY_MS));
  }

  updateTask$(
    boardId: number,
    taskId: number,
    changes: Partial<Omit<Task, 'id' | 'boardId'>>,
  ): Observable<Task> {
    const task = this.tasks.find((t) => t.boardId === boardId && t.id === taskId);
    if (!task) {
      return throwError(() => 'That task no longer exists.').pipe(delay(API_DELAY_MS));
    }

    Object.assign(task, changes);
    return of(this.cloneTask(task)).pipe(delay(API_DELAY_MS));
  }

  private cloneTask(task: Task): Task {
    return { ...task, tags: [...task.tags] };
  }

  deleteTask$(boardId: number, taskId: number): Observable<void> {
    const index = this.tasks.findIndex((t) => t.boardId === boardId && t.id === taskId);
    if (index === -1) {
      return throwError(() => 'That task no longer exists.').pipe(delay(API_DELAY_MS));
    }

    this.tasks.splice(index, 1);
    return of(undefined).pipe(delay(API_DELAY_MS));
  }
}

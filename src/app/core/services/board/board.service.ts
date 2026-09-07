import { Injectable } from '@angular/core';
import { Board } from '../../models/board.model';
import { Column } from '../../models/column.model';
import { Task, TaskStatus } from '../../models/task.model';

export type BoardFilter = 'all' | 'active' | 'completed';
export type BoardSort = 'name' | 'recent';

export interface BoardQuery {
  search?: string;
  filter?: BoardFilter;
  sort?: BoardSort;
}

// The four Kanban columns are fixed and shared by every board, so they're
// just a constant rather than data attached to each board.
const COLUMNS: Column[] = [
  { id: 'todo', name: 'To Do' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'completed', name: 'Completed' },
];

// Everything lives in a plain in-memory array — this stands in for a real
// backend. Every component that needs board/task data injects this service
// instead of holding its own copy, so there is a single source of truth.
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

  // Filtering, searching and sorting all happen here so BoardListComponent
  // stays a thin template-driven view over query params, with no data logic
  // of its own to keep in sync with this service.
  getBoards(query: BoardQuery = {}): Board[] {
    const search = query.search?.trim().toLowerCase() ?? '';
    const filter = query.filter ?? 'all';
    const sort = query.sort ?? 'recent';

    let results = this.boards.filter(
      (board) =>
        !search ||
        board.name.toLowerCase().includes(search) ||
        board.description.toLowerCase().includes(search),
    );

    if (filter !== 'all') {
      results = results.filter((board) => this.getBoardProgress(board.id).status === filter);
    }

    results = [...results];
    return sort === 'name'
      ? results.sort((a, b) => a.name.localeCompare(b.name))
      : results.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getBoard(id: number): Board | undefined {
    return this.boards.find((board) => board.id === id);
  }

  addBoard(name: string, description: string): Board {
    const board: Board = {
      id: this.nextBoardId++,
      name,
      description,
      accent: '#2563eb',
      members: [],
      updatedAt: Date.now(),
    };
    this.boards.push(board);
    return board;
  }

  // A board's "status" for filtering purposes is derived from its tasks —
  // there's no separate status field to keep in sync by hand.
  getBoardProgress(boardId: number): { completed: number; total: number; status: BoardFilter } {
    const tasks = this.getTasksForBoard(boardId);
    const completed = tasks.filter((task) => task.status === 'completed').length;
    const status: BoardFilter =
      tasks.length > 0 && completed === tasks.length ? 'completed' : 'active';
    return { completed, total: tasks.length, status };
  }

  getTasksForBoard(boardId: number, columnId?: TaskStatus): Task[] {
    return this.tasks.filter(
      (task) => task.boardId === boardId && (!columnId || task.status === columnId),
    );
  }

  getTask(boardId: number, taskId: number): Task | undefined {
    return this.tasks.find((task) => task.boardId === boardId && task.id === taskId);
  }

  updateTask(
    boardId: number,
    taskId: number,
    changes: Partial<Omit<Task, 'id' | 'boardId'>>,
  ): void {
    const task = this.getTask(boardId, taskId);
    if (task) {
      Object.assign(task, changes);
    }
  }
}

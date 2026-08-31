import { Injectable, signal } from '@angular/core';
import { Board, Task } from '../../shared/models/board.model';

// In a real app this data would come from an HTTP API.
// A signal-based mock service lets us focus on routing without needing a backend.
const MOCK_BOARDS: Board[] = [
  {
    id: 'website-redesign',
    name: 'Website Redesign',
    description: 'Revamp the marketing site before the Q4 launch.',
    columns: [
      { id: 'todo', name: 'To Do', taskIds: ['t1', 't2'] },
      { id: 'in-progress', name: 'In Progress', taskIds: ['t3'] },
      { id: 'done', name: 'Done', taskIds: ['t4'] },
    ],
    tasks: [
      { id: 't1', title: 'Design homepage hero', description: 'Explore three hero layout options.', status: 'todo' },
      { id: 't2', title: 'Write new copy', description: 'Refresh headline and subheading text.', status: 'todo' },
      { id: 't3', title: 'Build navigation bar', description: 'Implement responsive nav with active link state.', status: 'in-progress' },
      { id: 't4', title: 'Set up analytics', description: 'Add page view tracking.', status: 'done' },
    ],
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description: 'Native iOS and Android task tracker.',
    columns: [
      { id: 'todo', name: 'To Do', taskIds: ['t5'] },
      { id: 'in-progress', name: 'In Progress', taskIds: ['t6'] },
      { id: 'done', name: 'Done', taskIds: [] },
    ],
    tasks: [
      { id: 't5', title: 'Design onboarding flow', description: 'Three-screen welcome carousel.', status: 'todo' },
      { id: 't6', title: 'Implement push notifications', description: 'Wire up FCM for reminders.', status: 'in-progress' },
    ],
  },
];

@Injectable({
  providedIn: 'root', // one shared instance for the whole app
})
export class BoardService {
  // signal() holds the current list of boards; components read it reactively.
  private readonly boards = signal<Board[]>(MOCK_BOARDS);

  getBoards() {
    return this.boards.asReadonly();
  }

  getBoardById(boardId: string): Board | undefined {
    return this.boards().find((board) => board.id === boardId);
  }

  getTaskById(boardId: string, taskId: string): Task | undefined {
    return this.getBoardById(boardId)?.tasks.find((task) => task.id === taskId);
  }

  // Used by the task-detail form to demonstrate a real "unsaved changes" scenario.
  updateTaskDescription(boardId: string, taskId: string, description: string): void {
    this.boards.update((boards) =>
      boards.map((board) =>
        board.id !== boardId
          ? board
          : {
              ...board,
              tasks: board.tasks.map((task) => (task.id === taskId ? { ...task, description } : task)),
            },
      ),
    );
  }
}

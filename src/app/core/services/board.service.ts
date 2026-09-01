import { Injectable } from '@angular/core';
import { Board } from '../models/board.model';
import { Task } from '../models/task.model';

export type SortOrder = 'name' | 'recent';

// Stands in for a real backend: everything lives in a plain in-memory array.
// Every component that needs board/task data injects this service instead of
// holding its own copy, so there is a single source of truth.
@Injectable({ providedIn: 'root' })
export class BoardService {
  private nextBoardId = 4;

  private boards: Board[] = [
    { id: 1, name: 'Website Redesign', description: 'Revamp the marketing site before the Q4 launch.', createdAt: Date.now() - 3 * 86_400_000 },
    { id: 2, name: 'Mobile App', description: 'Native iOS and Android task tracker.', createdAt: Date.now() - 2 * 86_400_000 },
    { id: 3, name: 'Marketing Campaign', description: 'Plan and launch the spring product campaign.', createdAt: Date.now() - 86_400_000 },
  ];

  private tasks: Task[] = [
    { id: 1, boardId: 1, title: 'Design homepage hero', description: 'Explore three hero layout options.', status: 'todo' },
    { id: 2, boardId: 1, title: 'Write new copy', description: 'Refresh headline and subheading text.', status: 'todo' },
    { id: 3, boardId: 1, title: 'Build navigation bar', description: 'Implement responsive nav with active link state.', status: 'in-progress' },
    { id: 4, boardId: 1, title: 'Set up analytics', description: 'Add page view tracking.', status: 'done' },
    { id: 5, boardId: 2, title: 'Design onboarding flow', description: 'Three-screen welcome carousel.', status: 'todo' },
    { id: 6, boardId: 2, title: 'Implement push notifications', description: 'Wire up FCM for reminders.', status: 'in-progress' },
    { id: 7, boardId: 3, title: 'Draft social posts', description: 'Write a week of launch-day posts.', status: 'todo' },
  ];

  private nextTaskId = 8;

  // Returns a sorted copy so callers can't accidentally mutate internal state.
  getBoards(sort: SortOrder = 'recent'): Board[] {
    const copy = [...this.boards];
    return sort === 'name'
      ? copy.sort((a, b) => a.name.localeCompare(b.name))
      : copy.sort((a, b) => b.createdAt - a.createdAt);
  }

  getBoard(id: number): Board | undefined {
    return this.boards.find((board) => board.id === id);
  }

  addBoard(name: string, description: string): Board {
    const board: Board = { id: this.nextBoardId++, name, description, createdAt: Date.now() };
    this.boards.push(board);
    return board;
  }

  // "Next"/"previous" always follow a stable order (id order), independent of
  // whatever sort the boards list page happens to be showing.
  getAdjacentBoardIds(boardId: number): { prevId: number | null; nextId: number | null } {
    const ordered = [...this.boards].sort((a, b) => a.id - b.id);
    const index = ordered.findIndex((board) => board.id === boardId);
    return {
      prevId: index > 0 ? ordered[index - 1].id : null,
      nextId: index >= 0 && index < ordered.length - 1 ? ordered[index + 1].id : null,
    };
  }

  getTasksForBoard(boardId: number): Task[] {
    return this.tasks.filter((task) => task.boardId === boardId);
  }

  getTask(boardId: number, taskId: number): Task | undefined {
    return this.tasks.find((task) => task.boardId === boardId && task.id === taskId);
  }

  updateTask(boardId: number, taskId: number, changes: Partial<Pick<Task, 'title' | 'description'>>): void {
    const task = this.getTask(boardId, taskId);
    if (task) {
      Object.assign(task, changes);
    }
  }
}

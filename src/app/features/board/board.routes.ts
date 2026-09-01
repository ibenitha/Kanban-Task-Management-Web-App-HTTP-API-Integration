import { Routes } from '@angular/router';
import { BoardDetailComponent } from './board-detail/board-detail.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

// Lazily loaded — mounted under 'boards/:boardId' in app.routes.ts, so path
// '' here matches boards/:boardId itself.
export const BOARD_ROUTES: Routes = [
  {
    path: '',
    component: BoardDetailComponent,
    children: [
      // A task is nested under its board, not a flat sibling route: the URL
      // (boards/1/tasks/2) and the UI (the task form renders inside the
      // board's own layout, via BoardDetailComponent's nested router-outlet)
      // both reflect that a task is conceptually part of a board.
      { path: 'tasks/:taskId', component: TaskDetailComponent, canDeactivate: [unsavedChangesGuard] },
    ],
  },
];

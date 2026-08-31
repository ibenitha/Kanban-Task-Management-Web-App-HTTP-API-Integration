import { Routes } from '@angular/router';
import { BoardDetail } from './board-detail';
import { ColumnList } from './column-list/column-list';
import { TaskDetail } from './task-detail/task-detail';
import { unsavedChangesGuard } from '../core/guards/unsaved-changes-guard';

// This is the "feature module" for a single board, loaded lazily via loadChildren
// (see app.routes.ts). It is only downloaded by the browser the first time a user
// actually opens a board, which keeps the initial app bundle smaller.
//
// BoardDetail is a shell route: it renders the board header once, then a nested
// <router-outlet> inside it swaps between its two children below.
export const BOARD_DETAIL_ROUTES: Routes = [
  {
    path: '',
    component: BoardDetail,
    children: [
      // Default child: /boards/:boardId -> shows the columns and tasks for the board.
      { path: '', component: ColumnList, title: 'Board' },

      // Nested child route with its own route parameter: /boards/:boardId/tasks/:taskId
      {
        path: 'tasks/:taskId',
        component: TaskDetail,
        canDeactivate: [unsavedChangesGuard], // blocks leaving with an unsaved edit
        title: 'Task',
      },
    ],
  },
];

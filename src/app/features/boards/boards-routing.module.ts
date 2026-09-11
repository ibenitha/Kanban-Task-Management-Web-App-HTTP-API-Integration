import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BoardListComponent } from './pages/board-list/board-list.component';
import { BoardDetailsComponent } from './pages/board-details/board-details.component';
import { BoardOverviewComponent } from './pages/board-overview/board-overview.component';
import { ColumnDetailsComponent } from './pages/column-details/column-details.component';
import { TaskDetailsComponent } from './pages/task-details/task-details.component';
import { AddTaskComponent } from './pages/add-task/add-task.component';
import { authGuard } from '../../core/guards/auth.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

// This module is loaded lazily (see app.routes.ts), so these paths are all
// relative to 'boards' — '' here means the URL is exactly /boards.
const routes: Routes = [
  { path: '', component: BoardListComponent, title: 'Boards · FlowBoard' },

  {
    // :boardId requires being "logged in" — /boards itself stays public so
    // visitors can browse the list before authGuard ever applies.
    path: ':boardId',
    component: BoardDetailsComponent,
    canActivate: [authGuard],
    children: [
      // No content of its own — /boards/1 always means /boards/1/overview.
      { path: '', redirectTo: 'overview', pathMatch: 'full' },

      { path: 'overview', component: BoardOverviewComponent, title: 'Overview · FlowBoard' },
      { path: 'columns/:columnId', component: ColumnDetailsComponent, title: 'Column · FlowBoard' },
      { path: 'new-task', component: AddTaskComponent, title: 'New Task · FlowBoard' },

      // A task is nested under its board rather than a flat sibling route:
      // the URL and the UI (the form renders inside BoardDetailsComponent's
      // own layout) both reflect that a task belongs to a board.
      {
        path: 'tasks/:taskId',
        component: TaskDetailsComponent,
        canDeactivate: [unsavedChangesGuard],
        title: 'Task · FlowBoard',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BoardsRoutingModule {}

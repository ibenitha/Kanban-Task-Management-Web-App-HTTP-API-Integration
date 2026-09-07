import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardsRoutingModule } from './boards-routing.module';
import { BoardListComponent } from './pages/board-list/board-list.component';
import { BoardDetailsComponent } from './pages/board-details/board-details.component';
import { BoardOverviewComponent } from './pages/board-overview/board-overview.component';
import { ColumnDetailsComponent } from './pages/column-details/column-details.component';
import { TaskDetailsComponent } from './pages/task-details/task-details.component';

// This is the module app.routes.ts lazy-loads via loadChildren — it and
// everything it imports (its five page components, and their own imports)
// ship in a separate JS chunk, downloaded only once a user visits /boards.
//
// The page components below are standalone, so an NgModule brings them in
// through `imports`, not the older `declarations` array — that's only for
// non-standalone components/directives/pipes, and there aren't any here.
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    BoardsRoutingModule,
    BoardListComponent,
    BoardDetailsComponent,
    BoardOverviewComponent,
    ColumnDetailsComponent,
    TaskDetailsComponent,
  ],
})
export class BoardsModule {}

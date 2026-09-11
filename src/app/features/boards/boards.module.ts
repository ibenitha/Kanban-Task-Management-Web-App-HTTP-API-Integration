import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { BoardsRoutingModule } from './boards-routing.module';
import { BoardListComponent } from './pages/board-list/board-list.component';
import { BoardDetailsComponent } from './pages/board-details/board-details.component';
import { BoardOverviewComponent } from './pages/board-overview/board-overview.component';
import { ColumnDetailsComponent } from './pages/column-details/column-details.component';
import { TaskDetailsComponent } from './pages/task-details/task-details.component';
import { AddTaskComponent } from './pages/add-task/add-task.component';
import { boardsFeatureKey } from './state/boards.state';
import { boardsReducer } from './state/boards.reducer';
import { BoardsEffects } from './state/boards.effects';

// This is the module app.routes.ts lazy-loads via loadChildren — it and
// everything it imports (its six page components, the NgRx feature state
// below, and their own imports) ship in a separate JS chunk, downloaded
// only once a user visits /boards.
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
    AddTaskComponent,
  ],
  providers: [
    // Registering the 'boards' feature state and its effects here — rather
    // than in the root app.config.ts — keeps the state genuinely lazy: it
    // is only created the first time this module loads.
    provideState(boardsFeatureKey, boardsReducer),
    provideEffects(BoardsEffects),
  ],
})
export class BoardsModule {}

import { Routes } from '@angular/router';
import { BoardListComponent } from './pages/board-list/board-list.component';
import { LoginComponent } from './pages/login/login.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guard';

// Routes are matched top to bottom, first match wins — so literal paths come
// before parameterized ones, and the wildcard ('**') must stay last, or
// nothing after it would ever be reachable.
export const routes: Routes = [
  { path: '', redirectTo: 'boards', pathMatch: 'full' },

  // Public — anyone can browse the list of boards.
  { path: 'boards', component: BoardListComponent },

  // Entering a specific board requires being "logged in". The entire board
  // feature (board detail + nested task detail) is lazy-loaded: it isn't
  // downloaded until the user actually navigates into a board.
  {
    path: 'boards/:boardId',
    canActivate: [authGuard],
    loadChildren: () => import('./features/board/board.routes').then((m) => m.BOARD_ROUTES),
  },

  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },

  // The guard's redirect target.
  { path: 'login', component: LoginComponent },

  // Matches any URL nothing above matched — including a board/task id that
  // parses but doesn't correspond to a real record (see BoardDetailComponent
  // and TaskDetailComponent, which redirect to '/not-found' on a failed
  // lookup; that URL itself isn't registered, so it falls through to here).
  { path: '**', component: NotFoundComponent },
];

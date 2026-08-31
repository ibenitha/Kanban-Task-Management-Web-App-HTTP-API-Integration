import { Routes } from '@angular/router';
import { Boards } from './boards/boards';
import { Settings } from './settings/settings';
import { Login } from './login/login';
import { NotFound } from './not-found/not-found';
import { authGuard } from './core/guards/auth-guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes-guard';

// Root route table. Each entry maps a URL path to the component that should
// render there. Order matters: the router picks the first match, so the
// wildcard ('**') route must always come last.
export const routes: Routes = [
  // Redirect the empty path to /boards so the app has one clear "home" page.
  { path: '', redirectTo: 'boards', pathMatch: 'full' },

  // Main boards view — the list of all Kanban boards.
  { path: 'boards', component: Boards, title: 'Boards' },

  // Board details view. This whole section is lazy-loaded: Angular only
  // fetches board-detail.routes.ts (and everything it depends on) the first
  // time the user navigates to a URL starting with /boards/:boardId.
  {
    path: 'boards/:boardId',
    loadChildren: () => import('./board-detail/board-detail.routes').then((m) => m.BOARD_DETAIL_ROUTES),
  },

  // Settings page — protected by an auth guard (must be "logged in") and an
  // unsaved-changes guard (confirms before discarding an edited form).
  {
    path: 'settings',
    component: Settings,
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    title: 'Settings',
  },

  // Mock login page used to demonstrate the auth guard redirect + returnUrl.
  { path: 'login', component: Login, title: 'Log In' },

  // Fallback route: anything that doesn't match above renders a 404 page
  // instead of a blank screen or a browser error.
  { path: '**', component: NotFound, title: 'Page Not Found' },
];

// A note on advanced patterns not implemented here (kept out to stay simple):
// - Route preloading: enabled in app.config.ts via withPreloading(PreloadAllModules),
//   so the lazy board-detail bundle downloads quietly in the background right after
//   the app boots, rather than only on first click.
// - Auxiliary (named) routes: Angular supports rendering two components at once via
//   a second named <router-outlet>, e.g. a chat panel next to the main content. This
//   app only needs one primary outlet per level, so it isn't used, but the pattern is
//   configured the same way as above — just add a `outlet: 'name'` property to a route.

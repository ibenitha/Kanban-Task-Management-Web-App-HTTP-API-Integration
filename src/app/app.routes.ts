import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guard';

// Routes are matched top to bottom, first match wins — so 'not-found' (a
// real, literal path) is registered before the wildcard, and '**' stays
// last, or nothing after it would ever be reachable.
export const routes: Routes = [
  { path: '', redirectTo: 'boards', pathMatch: 'full' },

  // The entire boards area — list, board layout, overview, columns, tasks —
  // is lazy-loaded as a real Angular module: it is not part of the initial
  // bundle, and Angular only downloads it the first time the user navigates
  // to a URL starting with /boards.
  {
    path: 'boards',
    loadChildren: () => import('./features/boards/boards.module').then((m) => m.BoardsModule),
  },

  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [authGuard],
    title: 'Settings · FlowBoard',
  },

  // The guard's redirect target.
  { path: 'login', component: LoginComponent, title: 'Log In · FlowBoard' },

  { path: 'not-found', component: NotFoundComponent, title: 'Not Found · FlowBoard' },

  // Anything else — a typo'd URL, or a component redirecting here after a
  // failed board/task lookup — is sent to the one registered /not-found
  // route, rather than silently rendering NotFoundComponent for whatever
  // arbitrary URL the user typed.
  { path: '**', redirectTo: 'not-found' },
];

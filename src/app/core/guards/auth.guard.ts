import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

// Runs before the router activates a route — decides whether entering is
// allowed at all, before any component is even created.
//
// Returning a UrlTree (instead of calling router.navigate() as a side effect
// and then returning false) lets the router treat the redirect as the
// navigation's own result. This avoids a moment where the guard rejects the
// original navigation while a second, separate navigation to /login has
// already started — the two can otherwise race.
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Carry the originally-requested URL along so login can send the user
  // straight back to where they meant to go.
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

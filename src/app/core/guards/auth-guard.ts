import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

// CanActivate guard: runs before the router activates a route.
// If the user isn't "logged in", we redirect them to /login instead of
// letting them see the protected page (here, the settings page).
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // allow navigation to continue
  }

  // Remember where the user was trying to go, so login can send them back.
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

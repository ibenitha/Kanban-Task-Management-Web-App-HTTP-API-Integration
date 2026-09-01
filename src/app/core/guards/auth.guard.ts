import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Runs before the router activates a route — decides whether entering is
// allowed at all, before any component is even created.
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Carry the originally-requested URL along so login can send the user
  // straight back to where they meant to go.
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

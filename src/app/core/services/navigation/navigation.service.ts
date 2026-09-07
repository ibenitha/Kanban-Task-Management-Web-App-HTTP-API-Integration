import { Injectable, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

// Centralizes the router event handling that would otherwise be duplicated
// in every layout component. AppComponent reads isNavigating to show a
// subtle top loading bar, and navigationError to surface a message if a
// route (or a lazy chunk) genuinely fails to load.
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);

  isNavigating = false;
  navigationError: string | null = null;

  constructor() {
    // A root service lives for the whole app, so this subscription never
    // needs to be torn down — there's no ngOnDestroy for a singleton service.
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigating = true;
        this.navigationError = null;
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        this.isNavigating = false;
      } else if (event instanceof NavigationError) {
        this.isNavigating = false;
        this.navigationError = 'Something went wrong while loading that page. Please try again.';
        // One clear log per real failure — not a log on every navigation.
        console.error('Navigation error:', event.error);
      }
    });
  }
}

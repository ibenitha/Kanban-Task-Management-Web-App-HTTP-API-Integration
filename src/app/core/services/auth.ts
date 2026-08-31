import { Injectable, signal } from '@angular/core';

// A minimal mock of an authentication service.
// There's no real backend here — just enough state for the auth guard to check.
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loggedIn = signal(false);

  // Exposed as a readonly signal so components can react to login state,
  // but only this service is allowed to change it.
  isLoggedIn = this.loggedIn.asReadonly();

  login(): void {
    this.loggedIn.set(true);
  }

  logout(): void {
    this.loggedIn.set(false);
  }
}

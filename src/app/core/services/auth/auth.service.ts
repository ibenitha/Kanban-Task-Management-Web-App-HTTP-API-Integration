import { Injectable } from '@angular/core';

const STORAGE_KEY = 'flowboard.isLoggedIn';

// SIMULATED, CLIENT-SIDE AUTHENTICATION ONLY.
// There is no backend, no password and no real session — this exists purely
// to give authGuard something real to check. The state is kept in
// sessionStorage (not a service field) only so a page refresh during a demo
// doesn't immediately lose the "logged in" state; it is not a security
// mechanism. Real authentication must be verified server-side.
@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn(): boolean {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  }

  login(): void {
    sessionStorage.setItem(STORAGE_KEY, 'true');
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

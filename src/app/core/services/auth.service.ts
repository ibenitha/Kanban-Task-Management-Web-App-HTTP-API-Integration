import { Injectable } from '@angular/core';

// A deliberately simple stand-in for real authentication — just a boolean
// flag. Its only job in this app is to give authGuard something real to check.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = false;

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  login(): void {
    this.loggedIn = true;
  }

  logout(): void {
    this.loggedIn = false;
  }
}

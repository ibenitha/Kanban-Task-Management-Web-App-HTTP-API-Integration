import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth';

// Reached either directly, or via authGuard redirecting from a protected route.
// In the second case, the guard attaches ?returnUrl=... so we can send the
// user back to where they originally tried to go.
@Component({
  imports: [],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Bound automatically from the ?returnUrl= query param.
  returnUrl = input<string>('/boards');

  login(): void {
    this.authService.login();
    this.router.navigateByUrl(this.returnUrl()); // programmatic navigation
  }
}

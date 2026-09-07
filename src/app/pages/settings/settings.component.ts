import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

// Reachable only when authGuard allows it (see app.routes.ts) — a
// demonstration of a protected route, not a real account settings page.
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  displayName = 'Jordan Reyes';
  emailNotifications = true;
  weeklyDigest = false;
  saved = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  save(): void {
    this.saved = true;
  }

  logout(): void {
    // Logging out and leaving Settings happen together, as one action —
    // there'd be nothing left to protect on this page once logged out.
    this.authService.logout();
    this.router.navigate(['/boards']);
  }
}

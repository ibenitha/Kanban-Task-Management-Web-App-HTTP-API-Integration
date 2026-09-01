import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// Reachable only when authGuard allows it (see app.routes.ts).
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  logout(): void {
    // Logging out and leaving Settings happen together, as one action —
    // there'd be nothing left to protect on this page once logged out.
    this.authService.logout();
    this.router.navigate(['/boards']);
  }
}

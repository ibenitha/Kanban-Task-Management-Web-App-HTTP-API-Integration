import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';

// Persistent top navigation bar. It lives once in app.html (the root layout)
// so it stays on screen across every route instead of being re-created per page.
@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected readonly auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
  }
}

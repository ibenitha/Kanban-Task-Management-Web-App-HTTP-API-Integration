import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// The guard's redirect target. Reached either directly, or via authGuard
// redirecting from a protected route with ?returnUrl=... attached.
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  login(): void {
    this.authService.login();

    // A one-time read is enough here — the login page never stays mounted
    // across a param change, so there's no "reuse trap" to guard against.
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/boards';
    this.router.navigateByUrl(returnUrl);
  }
}

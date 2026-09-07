import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { isSafeInternalUrl } from '../../core/utils/url.util';

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
  // A one-time snapshot read is enough here — the login page never stays
  // mounted across a param change, so there's no "reuse trap" to guard
  // against.
  readonly returnUrl: string;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    // returnUrl comes from the query string, so it could be anything a user
    // typed or a crafted link set it to — only ever trust a plain internal
    // path, never an absolute URL, to avoid an open-redirect.
    this.returnUrl = isSafeInternalUrl(requested) ? requested : '/boards';
  }

  login(): void {
    this.authService.login();
    this.router.navigateByUrl(this.returnUrl);
  }
}

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth/auth.service';

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  const runGuard = (url: string) =>
    TestBed.runInInjectionContext(() => authGuard({} as never, { url } as never));

  it('allows navigation when logged in', () => {
    authService.login();
    expect(runGuard('/settings')).toBe(true);
  });

  it('returns a UrlTree to /login carrying returnUrl when logged out', () => {
    const result = runGuard('/settings');
    expect(result).toBeInstanceOf(UrlTree);

    const expected = router.createUrlTree(['/login'], { queryParams: { returnUrl: '/settings' } });
    expect(router.serializeUrl(result as UrlTree)).toBe(router.serializeUrl(expected));
  });
});

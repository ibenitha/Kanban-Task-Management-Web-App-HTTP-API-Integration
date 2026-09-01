import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/settings' } as never),
    );

  it('allows navigation when logged in', () => {
    authService.login();
    expect(runGuard()).toBe(true);
  });

  it('redirects to /login with a returnUrl when logged out', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    expect(runGuard()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/settings' } });
  });
});

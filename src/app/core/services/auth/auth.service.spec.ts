import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts logged out and toggles with login/logout', () => {
    expect(service.isLoggedIn()).toBe(false);
    service.login();
    expect(service.isLoggedIn()).toBe(true);
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('persists the logged-in state in sessionStorage', () => {
    service.login();
    expect(sessionStorage.getItem('flowboard.isLoggedIn')).toBe('true');
  });
});

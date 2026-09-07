import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NavigationService } from './navigation.service';

@Component({ template: '', standalone: true })
class BlankComponent {}

describe('NavigationService', () => {
  let harness: RouterTestingHarness;
  let service: NavigationService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'a', component: BlankComponent },
          { path: 'b', component: BlankComponent },
        ]),
      ],
    });
    service = TestBed.inject(NavigationService);
    harness = await RouterTestingHarness.create();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('clears isNavigating and navigationError once a navigation completes', async () => {
    await harness.navigateByUrl('/a');
    expect(service.isNavigating).toBe(false);
    expect(service.navigationError).toBeNull();
  });

  it('stays clear across a second, successful navigation', async () => {
    await harness.navigateByUrl('/a');
    await harness.navigateByUrl('/b');
    expect(service.isNavigating).toBe(false);
    expect(service.navigationError).toBeNull();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])], // AppComponent's template uses routerLink
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the persistent sidebar nav', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sidebar__nav')?.textContent).toContain('Boards');
  });

  it('renders a skip link targeting the main content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector('.skip-link') as HTMLAnchorElement;
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(compiled.querySelector('#main-content')).toBeTruthy();
  });
});

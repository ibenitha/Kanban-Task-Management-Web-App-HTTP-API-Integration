import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ColumnDetailsComponent } from './column-details.component';

describe('ColumnDetailsComponent', () => {
  async function createWith(columnId: string) {
    await TestBed.configureTestingModule({
      imports: [ColumnDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ boardId: '1', columnId })) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ColumnDetailsComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', async () => {
    const fixture = await createWith('todo');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows only the tasks belonging to the selected column', async () => {
    const fixture = await createWith('todo');
    expect(
      fixture.componentInstance.tasks.every((t) => t.status === 'todo' && t.boardId === 1),
    ).toBe(true);
  });

  it('redirects to /not-found for an unknown column id', async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ boardId: '1', columnId: 'made-up-column' })),
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(ColumnDetailsComponent);
    fixture.detectChanges(); // triggers ngOnInit -> the redirect

    expect(navigateSpy).toHaveBeenCalledWith(['/not-found']);
  });
});

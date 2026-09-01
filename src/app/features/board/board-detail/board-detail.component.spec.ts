import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BoardDetailComponent } from './board-detail.component';

describe('BoardDetailComponent', () => {
  let fixture: ComponentFixture<BoardDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          // Stubs the reactive paramMap the component subscribes to in ngOnInit.
          useValue: { paramMap: of(convertToParamMap({ boardId: '1' })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardDetailComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads the board matching :boardId', () => {
    expect(fixture.componentInstance.board?.name).toBe('Website Redesign');
    expect(fixture.componentInstance.tasks.length).toBeGreaterThan(0);
  });
});

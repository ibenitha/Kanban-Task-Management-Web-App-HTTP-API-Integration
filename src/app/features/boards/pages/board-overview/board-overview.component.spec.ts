import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BoardOverviewComponent } from './board-overview.component';

describe('BoardOverviewComponent', () => {
  let fixture: ComponentFixture<BoardOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardOverviewComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ boardId: '1' })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardOverviewComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('buckets board 1 tasks into their columns', () => {
    const { tasksByColumn } = fixture.componentInstance;
    expect(tasksByColumn['todo'].length).toBeGreaterThan(0);
    expect(tasksByColumn['completed'].length).toBeGreaterThan(0);
    expect(tasksByColumn['todo'].every((t) => t.boardId === 1)).toBe(true);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BoardListComponent } from './board-list.component';

describe('BoardListComponent', () => {
  let fixture: ComponentFixture<BoardListComponent>;
  let queryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    queryParamMap$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [BoardListComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap$ } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardListComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads all boards sorted by "recent" by default', () => {
    expect(fixture.componentInstance.sort).toBe('recent');
    expect(fixture.componentInstance.boards.length).toBeGreaterThan(0);
  });

  it('reacts to a query param change without re-creating the component', () => {
    queryParamMap$.next(convertToParamMap({ search: 'mobile' }));
    expect(fixture.componentInstance.boards.map((b) => b.name)).toEqual(['Mobile App']);
  });
});

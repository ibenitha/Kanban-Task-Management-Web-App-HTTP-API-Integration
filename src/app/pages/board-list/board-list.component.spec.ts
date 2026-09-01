import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BoardListComponent } from './board-list.component';

describe('BoardListComponent', () => {
  let fixture: ComponentFixture<BoardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardListComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads boards sorted by "recent" by default', () => {
    expect(fixture.componentInstance.sortOrder).toBe('recent');
    expect(fixture.componentInstance.boards.length).toBeGreaterThan(0);
  });
});

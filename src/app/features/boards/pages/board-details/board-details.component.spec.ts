import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BoardDetailsComponent } from './board-details.component';

describe('BoardDetailsComponent', () => {
  let fixture: ComponentFixture<BoardDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ boardId: '1' })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardDetailsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads the board matching :boardId', () => {
    expect(fixture.componentInstance.board?.name).toBe('Website Redesign');
  });

  it('exposes the four columns for the tab nav', () => {
    expect(fixture.componentInstance.columns.length).toBe(4);
  });
});

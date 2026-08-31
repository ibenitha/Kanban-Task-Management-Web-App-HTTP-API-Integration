import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BoardDetail } from './board-detail';

describe('BoardDetail', () => {
  let component: BoardDetail;
  let fixture: ComponentFixture<BoardDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardDetail],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('boardId', 'website-redesign'); // required input, set before rendering
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

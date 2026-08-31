import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ColumnList } from './column-list';

describe('ColumnList', () => {
  let component: ColumnList;
  let fixture: ComponentFixture<ColumnList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnList],
      providers: [provideRouter([])], // ColumnList injects ActivatedRoute and Router
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnList);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('boardId', 'website-redesign'); // required input, set before rendering
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

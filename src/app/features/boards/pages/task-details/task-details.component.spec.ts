import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TaskDetailsComponent } from './task-details.component';

describe('TaskDetailsComponent', () => {
  let fixture: ComponentFixture<TaskDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ boardId: '1', taskId: '1' })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDetailsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads the task matching :boardId and :taskId', () => {
    expect(fixture.componentInstance.task?.title).toBe('Design homepage hero');
  });

  it('reports unsaved changes only once the draft diverges, and clears after save', () => {
    const component = fixture.componentInstance;
    expect(component.hasUnsavedChanges()).toBe(false);

    component.draft.title = 'Something else';
    expect(component.hasUnsavedChanges()).toBe(true);

    component.save();
    expect(component.hasUnsavedChanges()).toBe(false);
    expect(component.justSaved).toBe(true);
  });

  it('refuses to save an empty title', () => {
    const component = fixture.componentInstance;
    component.draft.title = '   ';
    component.save();

    expect(component.titleInvalid).toBe(true);
    expect(component.task?.title).toBe('Design homepage hero'); // unchanged
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TaskDetailComponent } from './task-detail.component';

describe('TaskDetailComponent', () => {
  let fixture: ComponentFixture<TaskDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ boardId: '1', taskId: '1' })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDetailComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('loads the task matching :boardId and :taskId', () => {
    expect(fixture.componentInstance.task?.title).toBe('Design homepage hero');
  });

  it('reports unsaved changes only once the draft diverges', () => {
    const component = fixture.componentInstance;
    expect(component.hasUnsavedChanges()).toBe(false);

    component.draftTitle = 'Something else';
    expect(component.hasUnsavedChanges()).toBe(true);

    component.save();
    expect(component.hasUnsavedChanges()).toBe(false);
  });
});

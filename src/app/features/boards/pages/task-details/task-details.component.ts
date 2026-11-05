import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, filter, map, switchMap } from 'rxjs';
import { Task, TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import { Column } from '../../../../core/models/column.model';
import { KANBAN_COLUMNS } from '../../../../core/constants/kanban-columns';
import { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard';
import * as BoardsActions from '../../state/boards.actions';
import * as BoardsSelectors from '../../state/boards.selectors';

interface TaskDraft {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  tags: string;
}

// /boards/:boardId/tasks/:taskId — an editable task form. :boardId is
// inherited from the parent route, :taskId is this route's own parameter.
@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.css',
})
export class TaskDetailsComponent implements OnInit, HasUnsavedChanges {
  boardId!: number;
  taskId!: number;
  task?: Task;
  columns: Column[] = KANBAN_COLUMNS;

  private store = inject(Store);
  // HTTP LAB: true while PUT/DELETE is in flight — disables the buttons.
  saving$ = this.store.select(BoardsSelectors.selectBoardsSaving);

  draft: TaskDraft = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    tags: '',
  };
  private saved: TaskDraft = this.draft;
  submitted = false;
  justSaved = false;

  // Tracks which task's data currently populates the draft, so the draft is
  // only reset when the user genuinely navigates to a different task — not
  // on every unrelated store update this component happens to observe.
  private currentTaskKey?: string;

  // Set once the user confirms a delete, so the redirect check below does
  // not send them to /not-found when the task disappears from the Store.
  private deleting = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private actions$: Actions,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(BoardsActions.loadBoardData());

    this.route.paramMap
      .pipe(
        map((params) => ({
          boardId: Number(params.get('boardId')),
          taskId: Number(params.get('taskId')),
        })),
        switchMap(({ boardId, taskId }) => {
          this.boardId = boardId;
          this.taskId = taskId;
          return combineLatest([
            this.store.select(BoardsSelectors.selectTaskByBoardAndId(boardId, taskId)),
            this.store.select(BoardsSelectors.selectBoardsLoaded),
          ]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([task, loaded]) => {
        this.task = task;

        if (task) {
          this.populateDraftIfNewTask(task);
        } else if (loaded && !this.deleting) {
          // HTTP LAB: redirect only once the API data has loaded. If the
          // request failed, `loaded` stays false, so the user sees an error
          // toast instead of a misleading "not found" page.
          this.router.navigate(['/not-found']);
        }
      });

    // Marks the draft "saved" only once the API confirms the write —
    // not the moment the user clicks Save — and only for this task.
    this.actions$
      .pipe(
        ofType(BoardsActions.updateTaskSuccess),
        filter(({ task }) => task.boardId === this.boardId && task.id === this.taskId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ task }) => {
        this.saved = this.toDraft(task);
        this.justSaved = true;
      });
  }

  private populateDraftIfNewTask(task: Task): void {
    const key = `${task.boardId}:${task.id}`;
    if (this.currentTaskKey === key) {
      return;
    }

    this.currentTaskKey = key;
    this.saved = this.toDraft(task);
    this.draft = { ...this.saved };
    this.submitted = false;
    this.justSaved = false;
  }

  private toDraft(task: Task): TaskDraft {
    return {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      dueDate: task.dueDate,
      tags: task.tags.join(', '),
    };
  }

  get titleInvalid(): boolean {
    return this.submitted && this.draft.title.trim().length === 0;
  }

  // Required by HasUnsavedChanges — unsavedChangesGuard calls this before
  // letting the router navigate away from this route, whether the trigger
  // was a routerLink click, a programmatic navigate(), or the browser's
  // back/forward buttons.
  hasUnsavedChanges(): boolean {
    return JSON.stringify(this.draft) !== JSON.stringify(this.saved);
  }

  save(): void {
    this.submitted = true;
    if (!this.task || this.draft.title.trim().length === 0) {
      return;
    }

    // HTTP LAB: PUT replaces the whole record, so send the complete task:
    // the original (keeps id and boardId) with the edited fields on top.
    this.store.dispatch(
      BoardsActions.updateTask({
        task: {
          ...this.task,
          title: this.draft.title.trim(),
          description: this.draft.description.trim(),
          status: this.draft.status,
          priority: this.draft.priority,
          assignee: this.draft.assignee.trim(),
          dueDate: this.draft.dueDate,
          tags: this.draft.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
      }),
    );
    // A failed save leaves `saved` untouched, so the draft the user typed
    // stays exactly as they left it — see updateTaskFailure in the reducer.
  }

  deleteTask(): void {
    if (!window.confirm('Delete this task? This cannot be undone.')) {
      return;
    }

    // Treat the draft as saved so unsavedChangesGuard doesn't ask a second,
    // redundant confirmation on the way back to the overview.
    this.saved = { ...this.draft };
    this.deleting = true;
    this.store.dispatch(BoardsActions.deleteTask({ boardId: this.boardId, taskId: this.taskId }));
    // HTTP LAB: BoardsEffects sends DELETE /tasks/:id, then navigates back
    // to the overview once deleteTaskSuccess arrives.
  }
}

import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BoardService } from '../../core/services/board';
import { CanComponentDeactivate } from '../../core/guards/unsaved-changes-guard';

// Deepest nested route: /boards/:boardId/tasks/:taskId
// Both boardId and taskId arrive as inputs automatically (route param binding).
@Component({
  imports: [FormsModule],
  selector: 'app-task-detail',
  styleUrl: './task-detail.css',
  templateUrl: './task-detail.html',
})
export class TaskDetail implements CanComponentDeactivate {
  private readonly boardService = inject(BoardService);
  private readonly router = inject(Router);

  boardId = input.required<string>();
  taskId = input.required<string>();

  protected readonly task = computed(() => this.boardService.getTaskById(this.boardId(), this.taskId()));

  // Local editable copy of the description, so we can tell it apart from the
  // saved value and know whether there's something the user could lose.
  protected readonly draftDescription = signal('');
  private savedDescription = '';

  constructor() {
    // Angular reuses this same component instance when navigating between
    // sibling tasks (only :taskId changes), so we can't reset state just once
    // in the constructor — effect() re-runs any time task() produces a new
    // value, keeping the draft in sync with whichever task is now shown.
    effect(() => {
      const currentTask = this.task();
      this.savedDescription = currentTask?.description ?? '';
      this.draftDescription.set(this.savedDescription);
    });
  }

  // Required by CanComponentDeactivate — the unsavedChangesGuard calls this
  // before letting the router navigate away from this route.
  hasUnsavedChanges(): boolean {
    return this.draftDescription() !== this.savedDescription;
  }

  save(): void {
    this.boardService.updateTaskDescription(this.boardId(), this.taskId(), this.draftDescription());
    this.savedDescription = this.draftDescription();
  }

  // Programmatic navigation back to the board's column list.
  backToBoard(): void {
    this.router.navigate(['/boards', this.boardId()]);
  }
}

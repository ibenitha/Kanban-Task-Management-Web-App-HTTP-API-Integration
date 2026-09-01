import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Task } from '../../../core/models/task.model';
import { BoardService } from '../../../core/services/board.service';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';

// Nested child route: /boards/:boardId/tasks/:taskId. Reads both the
// inherited :boardId and its own :taskId off the same paramMap (see
// withRouterConfig({ paramsInheritanceStrategy: 'always' }) in app.config.ts).
@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css',
})
export class TaskDetailComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  boardId!: number;
  taskId!: number;
  task?: Task;

  // Editable draft fields, compared against the saved task to decide
  // whether unsavedChangesGuard should intervene.
  draftTitle = '';
  draftDescription = '';

  private paramSubscription?: Subscription;

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.paramSubscription = this.route.paramMap.subscribe((params) => {
      this.boardId = Number(params.get('boardId'));
      this.taskId = Number(params.get('taskId'));
      this.loadTask();
    });
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  private loadTask(): void {
    this.task = this.boardService.getTask(this.boardId, this.taskId);

    if (!this.task) {
      this.router.navigate(['/not-found']);
      return;
    }

    // Reset the draft whenever the underlying task changes — this component
    // instance is reused when navigating from one task straight to another.
    this.draftTitle = this.task.title;
    this.draftDescription = this.task.description;
  }

  hasUnsavedChanges(): boolean {
    if (!this.task) {
      return false;
    }
    return this.draftTitle !== this.task.title || this.draftDescription !== this.task.description;
  }

  save(): void {
    if (!this.task) {
      return;
    }
    this.boardService.updateTask(this.boardId, this.taskId, {
      title: this.draftTitle,
      description: this.draftDescription,
    });
    this.task = { ...this.task, title: this.draftTitle, description: this.draftDescription };
  }
}

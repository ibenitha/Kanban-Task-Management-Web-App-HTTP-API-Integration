import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Task, TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import { Column } from '../../../../core/models/column.model';
import { BoardService } from '../../../../core/services/board/board.service';
import { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard';

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
export class TaskDetailsComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  boardId!: number;
  taskId!: number;
  task?: Task;
  columns: Column[] = [];

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

  private paramSubscription?: Subscription;

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.columns = this.boardService.getColumns();
  }

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
    this.saved = this.toDraft(this.task);
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
    if (this.draft.title.trim().length === 0) {
      return;
    }

    this.boardService.updateTask(this.boardId, this.taskId, {
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
    });

    this.saved = { ...this.draft };
    this.justSaved = true;
  }
}

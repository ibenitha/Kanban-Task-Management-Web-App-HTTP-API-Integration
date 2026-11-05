import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Column } from '../../../../core/models/column.model';
import { TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import { KANBAN_COLUMNS } from '../../../../core/constants/kanban-columns';
import * as BoardsActions from '../../state/boards.actions';
import * as BoardsSelectors from '../../state/boards.selectors';

interface NewTaskDraft {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  tags: string;
}

// /boards/:boardId/new-task — the smallest form needed to demonstrate
// dispatching addTask. It deliberately mirrors TaskDetailsComponent's draft
// shape and required-title validation rather than introducing a new pattern.
@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-task.component.html',
  styleUrl: './add-task.component.css',
})
export class AddTaskComponent implements OnInit {
  boardId!: number;
  columns: Column[] = KANBAN_COLUMNS;

  private store = inject(Store);
  // HTTP LAB: true while POST /tasks is in flight — disables the submit
  // button (prevents double submits) and shows "Adding…".
  saving$ = this.store.select(BoardsSelectors.selectBoardsSaving);

  draft: NewTaskDraft = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    tags: '',
  };
  submitted = false;

  constructor(
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // A fresh instance of this component is created every time this route
    // is entered, so a one-time snapshot read is enough — unlike the other
    // board pages, there's no "reuse trap" to guard against here.
    this.boardId = Number(this.route.snapshot.paramMap.get('boardId'));
  }

  get titleInvalid(): boolean {
    return this.submitted && this.draft.title.trim().length === 0;
  }

  submit(): void {
    this.submitted = true;
    if (this.draft.title.trim().length === 0) {
      return;
    }

    this.store.dispatch(
      BoardsActions.addTask({
        task: {
          boardId: this.boardId,
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
    // HTTP LAB: BoardsEffects sends POST /tasks. On success it navigates
    // back to the overview and shows a toast. On failure it shows an error
    // toast and the user stays here with the form still filled in.
  }
}

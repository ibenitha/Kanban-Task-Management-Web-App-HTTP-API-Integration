import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Column } from '../../../../core/models/column.model';
import { TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import { BoardService } from '../../../../core/services/board/board.service';
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
  columns: Column[];

  private store = inject(Store);
  // Shared across the whole 'boards' feature state — see boards.state.ts.
  // While it's true here, it also means an initial board/task load in
  // flight elsewhere would disable this form too; acceptable for an app
  // this size (see README limitations).
  loading$ = this.store.select(BoardsSelectors.selectBoardsLoading);

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
    private boardService: BoardService,
    private route: ActivatedRoute,
  ) {
    this.columns = this.boardService.getColumns();
  }

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
    // BoardsEffects navigates back to the overview once addTaskSuccess
    // arrives — this component doesn't navigate itself.
  }
}

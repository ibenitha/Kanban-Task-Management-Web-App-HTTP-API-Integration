import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Column } from '../../../../core/models/column.model';
import { Task, TaskStatus } from '../../../../core/models/task.model';
import { BoardService } from '../../../../core/services/board/board.service';

// /boards/:boardId/columns/:columnId — a focused, single-column view.
// :boardId is inherited from the parent route; :columnId is this route's
// own parameter. Both come off the same paramMap.
@Component({
  selector: 'app-column-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './column-details.component.html',
  styleUrl: './column-details.component.css',
})
export class ColumnDetailsComponent implements OnInit, OnDestroy {
  boardId!: number;
  column?: Column;
  tasks: Task[] = [];

  private paramSubscription?: Subscription;

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.paramSubscription = this.route.paramMap.subscribe((params) => {
      this.boardId = Number(params.get('boardId'));
      this.loadColumn(params.get('columnId'));
    });
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  private loadColumn(columnId: string | null): void {
    this.column = this.boardService.getColumn(columnId ?? '');

    if (!this.column) {
      // :columnId is free-form text in the URL — "todo" is valid,
      // "made-up-column" is not. An unknown id is handled here rather than
      // rendering a blank or broken column view.
      this.router.navigate(['/not-found']);
      return;
    }

    this.tasks = this.boardService.getTasksForBoard(this.boardId, this.column.id as TaskStatus);
  }
}

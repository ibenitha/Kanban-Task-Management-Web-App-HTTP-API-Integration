import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Column } from '../../../../core/models/column.model';
import { Task } from '../../../../core/models/task.model';
import { BoardService } from '../../../../core/services/board/board.service';

// Default child of a board: /boards/:boardId/overview. :boardId isn't part
// of this route's own path — it's inherited from the parent (see
// withRouterConfig({ paramsInheritanceStrategy: 'always' }) in
// app.config.ts) — so this component reads it off the same paramMap as if
// it were its own.
@Component({
  selector: 'app-board-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './board-overview.component.html',
  styleUrl: './board-overview.component.css',
})
export class BoardOverviewComponent implements OnInit, OnDestroy {
  boardId!: number;
  columns: Column[] = [];
  tasksByColumn: Record<string, Task[]> = {};

  private paramSubscription?: Subscription;

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
  ) {
    this.columns = this.boardService.getColumns();
  }

  ngOnInit(): void {
    this.paramSubscription = this.route.paramMap.subscribe((params) => {
      this.boardId = Number(params.get('boardId'));
      this.tasksByColumn = Object.fromEntries(
        this.columns.map((column) => [
          column.id,
          this.boardService.getTasksForBoard(this.boardId, column.id),
        ]),
      );
    });
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }
}

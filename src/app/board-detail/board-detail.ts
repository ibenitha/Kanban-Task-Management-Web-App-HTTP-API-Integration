import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BoardService } from '../core/services/board';

// Shell for a single board. Because withComponentInputBinding() is enabled in
// app.config.ts, the :boardId segment from the URL (see board-detail.routes.ts)
// is passed straight into this `boardId` input — no manual ActivatedRoute code needed.
@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-board-detail',
  styleUrl: './board-detail.css',
  templateUrl: './board-detail.html',
})
export class BoardDetail {
  private readonly boardService = inject(BoardService);

  boardId = input.required<string>();

  // computed() re-evaluates automatically whenever boardId() changes.
  protected readonly board = computed(() => this.boardService.getBoardById(this.boardId()));
}

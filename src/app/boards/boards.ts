import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardService } from '../core/services/board';

// The app's home page: lists every board and links into its detail view.
@Component({
  imports: [RouterLink],
  selector: 'app-boards',
  styleUrl: './boards.css',
  templateUrl: './boards.html',
})
export class Boards {
  private readonly boardService = inject(BoardService);

  // A signal, so the template re-renders automatically if the list ever changes.
  protected readonly boards = this.boardService.getBoards();
}

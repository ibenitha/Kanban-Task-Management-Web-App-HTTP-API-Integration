import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Board } from '../../core/models/board.model';
import { BoardService, SortOrder } from '../../core/services/board.service';

// The app's home page. Also demonstrates:
// - query-parameter-driven sorting (?sort=name / ?sort=recent), read reactively
// - programmatic navigation to a newly created board (there's no link to
//   click for a board that doesn't exist yet)
@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './board-list.component.html',
  styleUrl: './board-list.component.css',
})
export class BoardListComponent implements OnInit, OnDestroy {
  boards: Board[] = [];
  sortOrder: SortOrder = 'recent';

  newBoardName = '';
  newBoardDescription = '';

  private queryParamSubscription?: Subscription;

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.queryParamSubscription = this.route.queryParamMap.subscribe((params) => {
      this.sortOrder = (params.get('sort') as SortOrder) ?? 'recent';
      this.boards = this.boardService.getBoards(this.sortOrder);
    });
  }

  ngOnDestroy(): void {
    this.queryParamSubscription?.unsubscribe();
  }

  createBoard(): void {
    const name = this.newBoardName.trim();
    if (!name) {
      return;
    }

    const board = this.boardService.addBoard(name, this.newBoardDescription.trim());
    this.newBoardName = '';
    this.newBoardDescription = '';

    // Navigating only makes sense after the board is successfully saved —
    // there's no link to click for a board that doesn't exist yet.
    this.router.navigate(['/boards', board.id]);
  }
}

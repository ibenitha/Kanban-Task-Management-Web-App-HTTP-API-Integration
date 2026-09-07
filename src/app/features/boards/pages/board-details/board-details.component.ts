import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { Board } from '../../../../core/models/board.model';
import { Column } from '../../../../core/models/column.model';
import { BoardService } from '../../../../core/services/board/board.service';

// The persistent shell for one board: header, breadcrumb and tab nav stay
// mounted while its own nested <router-outlet> swaps between the overview,
// a single column, or a task — exactly like the app-wide layout does for
// entire pages, one level down.
@Component({
  selector: 'app-board-details',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './board-details.component.html',
  styleUrl: './board-details.component.css',
})
export class BoardDetailsComponent implements OnInit, OnDestroy {
  boardId!: number;
  board?: Board;
  columns: Column[] = [];

  private paramSubscription?: Subscription;

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.columns = this.boardService.getColumns();
  }

  // Reactive, not a one-time snapshot: this component is reused when moving
  // between boards without ever being destroyed (e.g. a future "switch
  // board" control), so only a live subscription is guaranteed to see a
  // later :boardId change.
  ngOnInit(): void {
    this.paramSubscription = this.route.paramMap.subscribe((params) => {
      this.boardId = Number(params.get('boardId'));
      this.loadBoard();
    });
  }

  ngOnDestroy(): void {
    this.paramSubscription?.unsubscribe();
  }

  private loadBoard(): void {
    this.board = this.boardService.getBoard(this.boardId);

    if (!this.board) {
      // An id that parses but doesn't match a real board is handled here
      // intentionally, rather than left to fall through to an unregistered
      // URL and rely on the wildcard route by accident.
      this.router.navigate(['/not-found']);
    }
  }
}

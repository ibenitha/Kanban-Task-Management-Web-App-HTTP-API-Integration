import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, filter, switchMap, tap } from 'rxjs';
import { Board } from '../../../../core/models/board.model';
import { Column } from '../../../../core/models/column.model';
import { BoardService } from '../../../../core/services/board/board.service';
import * as BoardsActions from '../../state/boards.actions';
import * as BoardsSelectors from '../../state/boards.selectors';

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
export class BoardDetailsComponent implements OnInit {
  boardId!: number;
  board$!: Observable<Board | undefined>;
  columns: Column[];

  private destroyRef = inject(DestroyRef);

  constructor(
    private store: Store,
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.columns = this.boardService.getColumns();
  }

  ngOnInit(): void {
    this.store.dispatch(BoardsActions.loadBoardData());

    // Reactive, not a one-time snapshot: this component is reused when
    // moving between boards without ever being destroyed, so only a live
    // subscription is guaranteed to see a later :boardId change.
    this.board$ = this.route.paramMap.pipe(
      tap((params) => (this.boardId = Number(params.get('boardId')))),
      switchMap(() => this.store.select(BoardsSelectors.selectBoardById(this.boardId))),
    );

    // Redirect only once loading has genuinely finished — otherwise every
    // board would flash to /not-found while the mock API call is in flight.
    combineLatest([this.board$, this.store.select(BoardsSelectors.selectBoardsLoading)])
      .pipe(
        filter(([, loading]) => !loading),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([board]) => {
        if (!board) {
          this.router.navigate(['/not-found']);
        }
      });
  }
}

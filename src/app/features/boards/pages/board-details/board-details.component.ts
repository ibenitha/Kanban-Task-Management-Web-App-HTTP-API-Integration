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
import { KANBAN_COLUMNS } from '../../../../core/constants/kanban-columns';
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
  columns: Column[] = KANBAN_COLUMNS;

  private store = inject(Store);

  // HTTP LAB: loading and error states for the GET requests.
  loading$ = this.store.select(BoardsSelectors.selectBoardsLoading);
  loadError$ = this.store.select(BoardsSelectors.selectLoadError);

  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(BoardsActions.loadBoardData());

    // Reactive, not a one-time snapshot: this component is reused when
    // moving between boards without ever being destroyed, so only a live
    // subscription is guaranteed to see a later :boardId change.
    this.board$ = this.route.paramMap.pipe(
      tap((params) => (this.boardId = Number(params.get('boardId')))),
      switchMap(() => this.store.select(BoardsSelectors.selectBoardById(this.boardId))),
    );

    // HTTP LAB: redirect only once the API data has loaded. If the request
    // failed, `loaded` stays false, so the error message + Retry button
    // are shown instead of a misleading "not found" page.
    combineLatest([this.board$, this.store.select(BoardsSelectors.selectBoardsLoaded)])
      .pipe(
        filter(([, loaded]) => loaded),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([board]) => {
        if (!board) {
          this.router.navigate(['/not-found']);
        }
      });
  }

  retryLoad(): void {
    this.store.dispatch(BoardsActions.loadBoardData());
  }
}

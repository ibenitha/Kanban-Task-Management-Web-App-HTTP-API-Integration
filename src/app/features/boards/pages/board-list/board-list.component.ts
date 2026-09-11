import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map, switchMap } from 'rxjs';
import * as BoardsActions from '../../state/boards.actions';
import * as BoardsSelectors from '../../state/boards.selectors';
import { BoardFilter, BoardSort } from '../../state/boards.state';

interface BoardListViewModel {
  summaries: BoardsSelectors.BoardSummary[];
  loading: boolean;
  error: string | null;
}

// The app's home page. search/filter/sort all live in the URL's query
// string (?search=&filter=&sort=) instead of component state, so the exact
// list view is bookmarkable, survives a refresh, and works with browser
// back/forward. Boards themselves come from the NgRx store, not this
// component — vm$ combines both sources into one view model the template
// reads with a single async pipe.
@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board-list.component.html',
  styleUrl: './board-list.component.css',
})
export class BoardListComponent implements OnInit {
  search = '';
  filter: BoardFilter = 'all';
  sort: BoardSort = 'recent';

  newBoardName = '';
  newBoardDescription = '';

  vm$!: Observable<BoardListViewModel>;

  private destroyRef = inject(DestroyRef);

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Dispatched unconditionally — BoardsEffects itself skips the mock API
    // call when boards are already cached, so this never causes a
    // redundant reload.
    this.store.dispatch(BoardsActions.loadBoardData());

    // Eager subscription: the toolbar's search/filter/sort controls render
    // above vm$'s async-gated content, so they need these fields set right
    // away — e.g. on a direct deep link like /boards?filter=completed —
    // not only once the template's own async pipe happens to subscribe.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.search = params.get('search') ?? '';
      this.filter = (params.get('filter') as BoardFilter) ?? 'all';
      this.sort = (params.get('sort') as BoardSort) ?? 'recent';
    });

    this.vm$ = this.route.queryParamMap.pipe(
      map((params) => ({
        search: params.get('search') ?? '',
        filter: (params.get('filter') as BoardFilter) ?? 'all',
        sort: (params.get('sort') as BoardSort) ?? 'recent',
      })),
      switchMap((query) =>
        combineLatest([
          this.store.select(BoardsSelectors.selectFilteredBoardSummaries(query)),
          this.store.select(BoardsSelectors.selectBoardsLoading),
          this.store.select(BoardsSelectors.selectBoardsError),
        ]),
      ),
      map(([summaries, loading, error]) => ({ summaries, loading, error })),
    );
  }

  retryLoad(): void {
    this.store.dispatch(BoardsActions.loadBoardData());
  }

  // Every control writes back to the query string via the same helper, so
  // search/filter/sort can never drift out of sync with the URL. A null
  // value removes that query param entirely (used to clear the search box).
  updateQuery(
    patch: Partial<{ search: string | null; filter: BoardFilter; sort: BoardSort }>,
  ): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: patch,
      queryParamsHandling: 'merge',
    });
  }

  onSearchInput(value: string): void {
    this.updateQuery({ search: value || null });
  }

  createBoard(): void {
    const name = this.newBoardName.trim();
    if (!name) {
      return;
    }

    this.store.dispatch(
      BoardsActions.addBoard({ name, description: this.newBoardDescription.trim() }),
    );
    this.newBoardName = '';
    this.newBoardDescription = '';
    // BoardsEffects navigates to the new board once addBoardSuccess arrives
    // — the id doesn't exist yet at this point, so we can't navigate here.
  }

  openBoard(boardId: number): void {
    // Programmatic — used by the card's "Open board" button so the whole
    // card doesn't have to be a giant, hard-to-label link.
    this.router.navigate(['/boards', boardId]);
  }
}

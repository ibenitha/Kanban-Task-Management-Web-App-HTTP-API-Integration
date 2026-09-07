import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Board } from '../../../../core/models/board.model';
import { BoardFilter, BoardService, BoardSort } from '../../../../core/services/board/board.service';

// The app's home page. search/filter/sort all live in the URL's query
// string (?search=&filter=&sort=) instead of component state, so the exact
// list view is bookmarkable, survives a refresh, and works with browser
// back/forward.
@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board-list.component.html',
  styleUrl: './board-list.component.css',
})
export class BoardListComponent implements OnInit, OnDestroy {
  boards: Board[] = [];
  search = '';
  filter: BoardFilter = 'all';
  sort: BoardSort = 'recent';

  newBoardName = '';
  newBoardDescription = '';

  private queryParamSubscription?: Subscription;

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  // Subscribing (rather than a one-time snapshot read) means typing in the
  // search box or picking a different filter — both of which just update
  // the query string — re-renders the list without ever reloading the page.
  ngOnInit(): void {
    this.queryParamSubscription = this.route.queryParamMap.subscribe((params) => {
      this.search = params.get('search') ?? '';
      this.filter = (params.get('filter') as BoardFilter) ?? 'all';
      this.sort = (params.get('sort') as BoardSort) ?? 'recent';
      this.boards = this.boardService.getBoards({
        search: this.search,
        filter: this.filter,
        sort: this.sort,
      });
    });
  }

  ngOnDestroy(): void {
    this.queryParamSubscription?.unsubscribe();
  }

  progressFor(boardId: number) {
    return this.boardService.getBoardProgress(boardId);
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

    const board = this.boardService.addBoard(name, this.newBoardDescription.trim());
    this.newBoardName = '';
    this.newBoardDescription = '';

    // Programmatic navigation: there's no link to click for a board that
    // didn't exist a moment ago.
    this.router.navigate(['/boards', board.id]);
  }

  openBoard(boardId: number): void {
    // Also programmatic — used by the card's "Open board" button so the
    // whole card doesn't have to be a giant, hard-to-label link.
    this.router.navigate(['/boards', boardId]);
  }
}

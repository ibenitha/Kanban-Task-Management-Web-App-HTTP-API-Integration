import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoardService } from '../../core/services/board';
import { Task } from '../../shared/models/board.model';

// Shows the columns and tasks for the current board.
// boardId comes from the parent route (:boardId), inherited thanks to
// paramsInheritanceStrategy: 'always' in app.config.ts.
// filter/sort come from optional query params, e.g. ?filter=todo&sort=title-desc.
@Component({
  imports: [RouterLink],
  selector: 'app-column-list',
  styleUrl: './column-list.css',
  templateUrl: './column-list.html',
})
export class ColumnList {
  private readonly boardService = inject(BoardService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  boardId = input.required<string>();
  filter = input<string>('all'); // 'all' or a column id, e.g. 'todo'
  sort = input<'title-asc' | 'title-desc'>('title-asc');

  private readonly board = computed(() => this.boardService.getBoardById(this.boardId()));

  // Only keep columns that match the ?filter= query param ('all' keeps everything).
  protected readonly visibleColumns = computed(() => {
    const columns = this.board()?.columns ?? [];
    return this.filter() === 'all' ? columns : columns.filter((c) => c.id === this.filter());
  });

  // Looks up and sorts the tasks that belong to one column.
  tasksFor(columnId: string): Task[] {
    const board = this.board();
    if (!board) return [];
    const column = board.columns.find((c) => c.id === columnId);
    const tasks = board.tasks.filter((task) => column?.taskIds.includes(task.id));

    return [...tasks].sort((a, b) =>
      this.sort() === 'title-asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title),
    );
  }

  // Programmatic navigation: updates the query string without leaving this page
  // or losing the current route params. queryParamsHandling: 'merge' keeps any
  // other existing query params (e.g. changing sort keeps the current filter).
  updateFilter(filter: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { filter }, queryParamsHandling: 'merge' });
  }

  updateSort(sort: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { sort }, queryParamsHandling: 'merge' });
  }
}

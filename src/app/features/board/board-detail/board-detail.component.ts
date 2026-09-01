import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { Board } from '../../../core/models/board.model';
import { Task } from '../../../core/models/task.model';
import { BoardService } from '../../../core/services/board.service';

// The most routing-dense component in the app: reads :boardId reactively,
// owns a second nested <router-outlet> (for tasks/:taskId), and builds
// "next/previous board" links from service data.
@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './board-detail.component.html',
  styleUrl: './board-detail.component.css',
})
export class BoardDetailComponent implements OnInit, OnDestroy {
  boardId!: number;
  board?: Board;
  tasks: Task[] = [];
  prevBoardId: number | null = null;
  nextBoardId: number | null = null;

  private paramSubscription?: Subscription;

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Subscribing (rather than a one-time route.snapshot read) matters
    // concretely here: clicking "Next board" navigates from /boards/1 to
    // /boards/2, which matches this exact same route — Angular reuses this
    // component instance instead of destroying/recreating it, so ngOnInit
    // does NOT run again. Only a live subscription picks up the new id.
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
      this.router.navigate(['/not-found']);
      return;
    }

    this.tasks = this.boardService.getTasksForBoard(this.boardId);
    const { prevId, nextId } = this.boardService.getAdjacentBoardIds(this.boardId);
    this.prevBoardId = prevId;
    this.nextBoardId = nextId;
  }
}

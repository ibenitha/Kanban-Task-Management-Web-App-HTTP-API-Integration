import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// The one registered /not-found route. Reached either by an unmatched URL
// (the '**' wildcard redirects here) or intentionally, by a component that
// looked up a board/task id and found nothing.
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css',
})
export class NotFoundComponent {}

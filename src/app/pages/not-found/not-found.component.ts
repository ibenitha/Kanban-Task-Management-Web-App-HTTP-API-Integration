import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Matched by the '**' wildcard route — anything unmatched (including a bad
// /boards/999 or /boards/1/tasks/999 that a component redirects away from)
// lands here.
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css',
})
export class NotFoundComponent {}

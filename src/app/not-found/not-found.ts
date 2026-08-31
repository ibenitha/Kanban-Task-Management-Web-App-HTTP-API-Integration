import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Matched by the '**' wildcard route — anything that isn't a known path lands here.
@Component({
  imports: [RouterLink],
  selector: 'app-not-found',
  styleUrl: './not-found.css',
  templateUrl: './not-found.html',
})
export class NotFound {}

import { Component, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Header } from './shared/header/header';

// Root component: the persistent app "shell". The header stays fixed on
// screen while RouterOutlet swaps out the page content underneath it as the
// user navigates — this is what makes it a Single Page Application.
@Component({
  imports: [RouterOutlet, Header],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);

  // True while a navigation is in flight, used to show a thin loading bar.
  // This demonstrates listening to the router's navigation lifecycle events.
  protected readonly navigating = signal(false);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigating.set(true); // navigation started
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        // navigation finished — successfully, cancelled (e.g. by a guard), or errored
        this.navigating.set(false);
      }
    });
  }
}

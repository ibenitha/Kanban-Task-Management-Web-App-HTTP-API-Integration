import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavigationService } from './core/services/navigation/navigation.service';

// Root layout: a sidebar that stays mounted across every navigation (it
// lives outside <router-outlet>), plus the outlet itself where the Router
// renders whichever page matches the current URL.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected navigation = inject(NavigationService);
}

import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanComponentDeactivate } from '../core/guards/unsaved-changes-guard';

// Reachable only when authGuard allows it (see app.routes.ts).
// Also demonstrates canDeactivate on a plain form, separate from the task-editing example.
@Component({
  imports: [FormsModule],
  selector: 'app-settings',
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings implements CanComponentDeactivate {
  private savedDisplayName = 'Jane Doe';

  protected readonly displayName = signal(this.savedDisplayName);
  protected readonly saved = signal(false);

  hasUnsavedChanges(): boolean {
    return this.displayName() !== this.savedDisplayName;
  }

  save(): void {
    this.savedDisplayName = this.displayName();
    this.saved.set(true);
  }
}

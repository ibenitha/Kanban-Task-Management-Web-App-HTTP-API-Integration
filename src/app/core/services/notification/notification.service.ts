import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppNotification {
  type: 'success' | 'error';
  message: string;
}

// A small, deliberate example of SERVICE-BASED shared state: boards and
// tasks are owned by the NgRx store, but "here's a toast to show right now"
// is transient UI state that doesn't need its own actions/reducer/selector.
// A BehaviorSubject is the simplest thing that actually works.
@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Private and mutable — only this service is ever allowed to push a new
  // value onto the stream.
  private readonly notificationSubject = new BehaviorSubject<AppNotification | null>(null);

  // Public and read-only — components can subscribe (usually via the async
  // pipe) but can never push a value themselves.
  readonly notification$ = this.notificationSubject.asObservable();

  success(message: string): void {
    this.notificationSubject.next({ type: 'success', message });
  }

  error(message: string): void {
    this.notificationSubject.next({ type: 'error', message });
  }

  clear(): void {
    this.notificationSubject.next(null);
  }
}

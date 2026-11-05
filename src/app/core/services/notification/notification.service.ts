import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/*
 * Defines the data required to display a notification.
 * `type` determines its success/error style, and `message` is the text shown.
 */
export interface AppNotification {
  type: 'success' | 'error';
  message: string;
}

/*
 * This service demonstrates service-based shared state.
 *
 * Boards and tasks use NgRx because they have several operations and are
 * shared across many components. A toast is simple, temporary UI state, so
 * creating Actions, Reducers, Selectors, and Effects for it would add
 * unnecessary complexity.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  /*
   * The BehaviorSubject owns the current notification.
   * It requires an initial value, so null means "no notification."
   *
   * It is private because only this service should call next() and update it.
   */
  private readonly notificationSubject =
    new BehaviorSubject<AppNotification | null>(null);

  /*
   * Components receive a read-only Observable and normally subscribe with
   * the async pipe. asObservable() prevents them from calling next()
   * and modifying the notification directly.
   */
  readonly notification$ =
    this.notificationSubject.asObservable();

  // Publish a success notification to all current subscribers.
  success(message: string): void {
    this.notificationSubject.next({
      type: 'success',
      message,
    });
  }

  // Publish an error notification to all current subscribers.
  error(message: string): void {
    this.notificationSubject.next({
      type: 'error',
      message,
    });
  }

  // Publish null to remove the current notification.
  clear(): void {
    this.notificationSubject.next(null);
  }
}
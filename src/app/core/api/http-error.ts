import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

/*
 * Shared error handler for BoardService and TaskService.
 *
 * It turns a raw HttpErrorResponse into one short, user-friendly message.
 * Effects put that message in a failure action, and the message is then
 * shown as an error toast.
 *
 * Usage inside a service: catchError(handleHttpError('load boards'))
 */
export function handleHttpError(operation: string) {
  return (error: HttpErrorResponse): Observable<never> => {
    let message: string;

    if (error.status === 0) {
      // Status 0 means the request never reached the server (offline,
      // json-server not running, CORS problem, ...).
      message = `Could not ${operation}. The server is unreachable — please try again.`;
    } else if (error.status === 404) {
      message = `Could not ${operation}. It no longer exists on the server.`;
    } else {
      message = `Could not ${operation}. The server responded with error ${error.status}.`;
    }

    return throwError(() => message);
  };
}

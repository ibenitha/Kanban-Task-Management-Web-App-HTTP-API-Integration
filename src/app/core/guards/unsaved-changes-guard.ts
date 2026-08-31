import { CanDeactivateFn } from '@angular/router';

// Any component that wants this guard applied must implement this shape.
// hasUnsavedChanges() lets each component decide for itself what "unsaved" means.
export interface CanComponentDeactivate {
  hasUnsavedChanges(): boolean;
}

// CanDeactivate guard: runs before the router navigates AWAY from a route.
// Returning false cancels the navigation, keeping the user on the current page.
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true; // nothing to lose, navigate freely
  }

  // A simple browser confirm() is enough to demonstrate the guard;
  // a real app would likely show a custom modal instead.
  return window.confirm('You have unsaved changes. Leave this page anyway?');
};

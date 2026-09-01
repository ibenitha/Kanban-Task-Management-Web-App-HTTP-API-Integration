import { CanDeactivateFn } from '@angular/router';

// A routed component that wants this guard applied must implement this —
// it's how the guard asks "would leaving right now lose something?".
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

// Runs before the router leaves the current route — consulted any time
// navigation would remove the currently active component, whether that's a
// routerLink click, a programmatic navigate(), or the browser's back button.
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  return window.confirm('You have unsaved changes. Leave this page and discard them?');
};

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withComponentInputBinding, withPreloading, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Lets a route/query param bind straight to a matching component @Input,
      // e.g. `:boardId` in the URL fills an `boardId = input<string>()` property
      // automatically — no manual ActivatedRoute subscription needed.
      // 'undefinedIfStale' keeps an input's own default (e.g. filter = input('all'))
      // when the matching query param has never been present on this route —
      // the router's default ('alwaysUndefined') would otherwise overwrite it
      // with undefined immediately, even before the user ever touches the filter.
      withComponentInputBinding({ unmatchedInputBehavior: 'undefinedIfStale' }),
      // Without this, a child route only receives ITS OWN params as inputs.
      // 'always' lets nested routes (like tasks/:taskId) also inherit the
      // parent's :boardId param.
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      // Preloads lazy-loaded routes (like the board-detail feature) in the
      // background after the initial page finishes loading, so navigating to
      // a board later feels instant instead of showing a loading gap.
      withPreloading(PreloadAllModules),
    ),
  ],
};

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // By default a parent route's params are only inherited by a child
      // whose own path is empty. tasks/:taskId has a non-empty path of its
      // own, so without this, TaskDetailComponent's route.paramMap would
      // never contain the parent's :boardId — 'always' makes nested
      // parameterized routes inherit ancestor params too.
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
  ],
};

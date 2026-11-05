import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { environment } from '../environments/environment';
import { InMemoryDataService } from './core/api/in-memory-data.service';
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

    // HTTP LAB: makes HttpClient injectable app-wide (used by BoardService
    // and TaskService).
    provideHttpClient(),

    // HTTP LAB: in production (Netlify) there is no json-server, so the
    // in-memory web API answers HttpClient requests instead. In development
    // this is skipped and requests go to the real json-server.
    // put204/post204: false → return the saved record, like json-server does.
    ...(environment.useInMemoryApi
      ? [
          importProvidersFrom(
            HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, {
              delay: 400,
              post204: false,
              put204: false,
            }),
          ),
        ]
      : []),

    // The root Store has no reducers of its own — the 'boards' feature state
    // and its effects are registered lazily, inside BoardsModule, so their
    // code only ships once a user actually visits /boards.
    provideStore(),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode(), trace: false, traceLimit: 75 }),
  ],
};

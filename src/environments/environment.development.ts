/*
 * DEVELOPMENT environment (used by `ng serve`).
 *
 * angular.json swaps this file in for environment.ts through
 * `fileReplacements`, so the code always imports '../environments/environment'.
 *
 * Requests go to the real json-server REST API started with `npm run api`,
 * so every GET/POST/PUT/DELETE is visible in the browser's Network tab.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  useInMemoryApi: false,
};

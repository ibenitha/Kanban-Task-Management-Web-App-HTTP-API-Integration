/*
 * PRODUCTION environment (used by `ng build`, which is what Netlify runs).
 *
 * Netlify only hosts static files, so there is no json-server running in
 * production. Instead, `useInMemoryApi: true` registers Angular's in-memory
 * web API (see app.config.ts), which answers the same HttpClient requests
 * inside the browser. BoardService and TaskService do not change at all.
 *
 * To use a real hosted backend later, set apiUrl to its URL and
 * useInMemoryApi to false.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  useInMemoryApi: true,
};

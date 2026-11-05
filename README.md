# FlowBoard

A Kanban task board built to practice, in order, three Angular labs: **Routing and Navigation**,
**State Management**, and **HTTP & APIs**. It's a learning project, not a production task manager —
"login" is simulated and the backend is a mock REST API — but the routing, the NgRx state and the
HTTP layer are all real: every board and task is read and written with `HttpClient` through
dedicated data services.

> **HTTP lab reviewers:** start with [HTTP & APIs](#http--apis) below, or the one-page
> [REVIEW-GUIDE-HTTP.md](REVIEW-GUIDE-HTTP.md). Code changed for this lab is marked with
> `HTTP LAB` comments — search the project for that text to find every change.

```
Component
   ↓ dispatches
Action
   ↓ received by
Effect
   ↓ calls
BoardService / TaskService  (HttpClient → REST API)
   ↓ returns Observable
Success or Failure Action
   ↓ handled by
Reducer
   ↓ updates
Store
   ↓ queried by
Selector
   ↓ async pipe
Browser updates
```

## Why this lab is about routing

A Kanban tool is naturally multi-page: "which board am I looking at" and "which task am I
editing" are exactly the kind of state that belongs in the URL, not in a component field —
because a URL is bookmarkable, survives a refresh, works with browser back/forward, and can be
protected by a guard *before* a component is even created. This app is built to make that argument
concrete rather than theoretical.

## Main features

- A boards list with URL-driven search, filter and sort (`/boards?search=&filter=&sort=`).
- A persistent board layout (`BoardDetailsComponent`) with its own nested router-outlet, hosting
  an overview (all four Kanban columns), a single-column view, and a task editor.
- A lazily-loaded `BoardsModule` — the entire `/boards` area, downloaded only when visited.
- `authGuard` (`CanActivate`) protecting `/boards/:boardId` and `/settings`, with a `returnUrl`
  round-trip through `/login`.
- `unsavedChangesGuard` (`CanDeactivate`) protecting an in-progress task edit from being lost.
- A `NavigationService` that turns Router events into a loading indicator and an error message.
- **Boards and tasks are owned by an NgRx store** (`features/boards/state/`), fed by
  `BoardService` and `TaskService`, which call a REST API with `HttpClient` (json-server in
  development, an in-browser mock API in production — see [HTTP & APIs](#http--apis)).
- **Full request/success/failure action flow** for loading, adding, updating and deleting, handled
  by `BoardsEffects` and lazily registered by `BoardsModule` — the state's code ships in the same
  lazy chunk as the rest of the boards feature.
- **A small, deliberate service-based state example** — `NotificationService`, a
  `BehaviorSubject`-backed toast shown at the top of every page.
- An **add-task** page (`/boards/:boardId/new-task`) demonstrating the same `addTask` flow end to
  end, plus a delete action (with confirmation) on the task form.
- NgRx DevTools wired up in `app.config.ts` for inspecting every dispatched action and the state
  before/after each one.
- 110 tests across 20 spec files, including a 15-scenario routing integration suite and dedicated
  reducer/selector/effects/notification-service specs.

## Technology versions

| Tool | Version |
|---|---|
| Angular CLI | 22.1.6 |
| Angular (core, router, forms, common, platform-browser) | 22.1.3 |
| @ngrx/store, @ngrx/effects, @ngrx/store-devtools | 22.0.1 |
| Node.js | 24.18.0 |
| npm | 11.16.0 |
| TypeScript | 6.0.3 |
| Vitest | 4.1.11 |
| zone.js | 0.16.x (added — see [Architecture decision](#architecture-decision-and-why)) |

## Installation

```bash
npm install
```

## Development server

The app needs the mock REST API running. Use **two terminals**:

```bash
# terminal 1 — json-server REST API on http://localhost:3000
npm run api

# terminal 2 — Angular dev server on http://localhost:4200
npm start
```

Open `http://localhost:4200`. `npm run api` resets `mock-api/db.json` from `mock-api/seed.json`
each time, so every session starts with the same three boards. If you forget terminal 1, the app
shows "The server is unreachable" with a Retry button — that is the error handling working.

## Running tests

```bash
npm test
```

Runs the full Vitest suite once (non-watch). All 21 spec files / 113 tests should pass. No server
needs to be running — HTTP calls are intercepted by `HttpTestingController` or the in-memory API.

## Production build

```bash
npm run build
```

Output goes to `dist/kanban-task-management/browser` (Angular's application builder always
appends a `browser/` subfolder; there's no `outputPath` override in `angular.json`, so this is the
default). Check the build's own printed output — it lists a `boards-module` chunk separately from
the initial bundle, which is the first piece of proof that lazy loading is actually working (see
[Lazy loading](#lazy-loading) below for the full story).

## Project structure

```
src/app/
├── app.component.ts/html/css      Root layout: sidebar + skip link + root <router-outlet>
├── app.routes.ts                  Top-level route table
├── app.routes.spec.ts             15-scenario routing integration suite (RouterTestingHarness)
├── app.config.ts                  provideRouter(), provideHttpClient(), in-memory API switch
│
├── core/
│   ├── api/                       (HTTP lab)
│   │   ├── api.config.ts          API_ENDPOINTS — every API URL, built from the environment
│   │   ├── http-error.ts          handleHttpError() — HttpErrorResponse → friendly message
│   │   └── in-memory-data.service.ts  Mock backend for production (Netlify), seeded from mock-api/seed.json
│   ├── constants/
│   │   └── kanban-columns.ts      KANBAN_COLUMNS — the four fixed columns (config, not API data)
│   ├── models/
│   │   ├── board.model.ts         Board interface
│   │   ├── task.model.ts          Task interface + TaskStatus/TaskPriority union types
│   │   └── column.model.ts        Column interface (id is just a TaskStatus)
│   ├── services/                  each service in its own folder, alongside its own spec
│   │   ├── board/board.service.ts       HTTP: GET/POST/DELETE /boards
│   │   ├── task/task.service.ts         HTTP: GET/POST/PUT/DELETE /tasks
│   │   ├── auth/auth.service.ts         Simulated isLoggedIn()/login()/logout(), sessionStorage-backed
│   │   ├── navigation/navigation.service.ts  Router-events → loading indicator + error state
│   │   └── notification/notification.service.ts  BehaviorSubject-based toast — service-based shared state
│   ├── guards/
│   │   ├── auth.guard.ts          authGuard — CanActivate, returns a UrlTree on denial
│   │   └── unsaved-changes.guard.ts  unsavedChangesGuard — CanDeactivate + HasUnsavedChanges
│   └── utils/
│       └── url.util.ts            isSafeInternalUrl() — returnUrl open-redirect guard
│
├── pages/                         Top-level, eagerly-loaded routes
│   ├── login/                     'login' — the auth guard's redirect target
│   ├── settings/                  'settings' — guarded, small settings form + logout
│   └── not-found/                 'not-found' — the one registered 404 page
│
└── features/boards/                Lazily-loaded boards area (loadChildren)
    ├── boards.module.ts            NgModule: imports page components + provideState/provideEffects
    ├── boards-routing.module.ts    RouterModule.forChild() route table for this feature
    ├── state/                      The NgRx 'boards' feature — see State management below
    │   ├── boards.state.ts          BoardsState shape, initial state, feature key, query types
    │   ├── boards.actions.ts        Every action this feature dispatches
    │   ├── boards.reducer.ts        Pure state transitions
    │   ├── boards.selectors.ts      Reusable, derived state queries
    │   └── boards.effects.ts        Async work: calls BoardService, dispatches success/failure
    └── pages/
        ├── board-list/             '' (i.e. /boards) — search/filter/sort, create a board
        ├── board-details/          ':boardId' — persistent layout, breadcrumb, tabs, nested outlet
        ├── board-overview/         'overview' — the four-column Kanban board, "+ Add task" entry point
        ├── column-details/         'columns/:columnId' — one column's tasks
        ├── task-details/           'tasks/:taskId' — editable task form, delete, CanDeactivate
        └── add-task/               'new-task' — the smallest form that dispatches addTask
```

### What each folder is responsible for

- **`core/models`** — plain TypeScript interfaces and union types. No behavior, just shapes.
- **`core/services`** — HTTP data services (`BoardService`, `TaskService`) or a small piece of
  cross-cutting UI state (`NavigationService`, `NotificationService`). Boards and tasks are
  **owned by the NgRx store** — see [State management](#state-management) — the data services are
  purely the HTTP layer.
- **`core/api`** — HTTP configuration shared by the data services: endpoints, error handling and
  the production mock backend.
- **`core/guards`** — functional route guards, plus the small `HasUnsavedChanges` contract a
  component implements to opt into `unsavedChangesGuard`.
- **`core/utils`** — a single, tested helper (`isSafeInternalUrl`) with no framework dependencies.
- **`pages/*`** — routes that don't belong to any particular feature and don't need lazy loading
  (they're tiny, and loading them lazily would just add a network round-trip for no benefit).
- **`features/boards/state`** — the NgRx store for this feature: actions, reducer, selectors,
  effects. Registered lazily inside `BoardsModule`, not the root `app.config.ts` — see
  [State management](#state-management).
- **`features/boards/*`** — everything related to browsing and editing boards, loaded as one unit.

## Architecture decision, and why

The app was already scaffolded as an Angular 22 **standalone** application (`app.routes.ts` +
`provideRouter()` in `app.config.ts`, no `AppModule`). That's preserved for the root app and every
top-level page (`pages/login`, `pages/settings`, `pages/not-found`) — there was no reason to
introduce an `NgModule` where standalone already works cleanly.

The lab specifically asks for a lazily-loaded **feature module** using `RouterModule`, though, so
`features/boards` is a genuine `NgModule`-based feature:

- **`BoardsRoutingModule`** calls `RouterModule.forChild(routes)` — the classic feature-routing
  pattern.
- **`BoardsModule`** imports `BoardsRoutingModule` plus the five page components.

Those five page components (`BoardListComponent`, `BoardDetailsComponent`,
`BoardOverviewComponent`, `ColumnDetailsComponent`, `TaskDetailsComponent`) are still standalone —
an `NgModule` can bring in standalone components through its own `imports` array exactly like it
imports other modules; they don't need to be declared the old way, and there's no reason to
convert them just to fit a module that only exists to prove the `RouterModule.forChild()` pattern.
This is a genuinely common, supported hybrid in modern Angular, not a workaround.

`app.routes.ts` reaches this module the same way any lazy route does:

```ts
{ path: 'boards', loadChildren: () => import('./features/boards/boards.module').then((m) => m.BoardsModule) }
```

### zone.js was added back in

This project's `ng new` output didn't include `zone.js` — recent Angular CLI defaults to a
signal-based, zoneless setup. This lab deliberately avoids Signals (the curriculum it's built
around predates them, and the brief explicitly asks not to reach for them), and every component
here reads route/query parameters the classic way:

```ts
this.route.paramMap.subscribe((params) => {
  this.boardId = Number(params.get('boardId'));
  ...
});
```

That pattern — reassigning a plain class property inside a `.subscribe()` callback — only
auto-refreshes the template under classic, zone.js-based change detection. Without zone.js, a
zoneless app has no way to know that property changed, and the view would silently go stale (most
visibly, "Next board"-style navigation would stop updating on-screen content even though the URL
changed correctly). `zone.js` is imported once, at the very top of `main.ts`, and nothing else
changes — Angular auto-detects it and switches to the classic behavior.

## Route table

### Top level (`app.routes.ts`)

| Path | Renders | Guards | Notes |
|---|---|---|---|
| `''` | — | — | `redirectTo: 'boards'` |
| `'boards'` | (lazy) `BoardsModule` | — | the whole boards area; see below |
| `'settings'` | `SettingsComponent` | `authGuard` | protected |
| `'login'` | `LoginComponent` | — | the guard's redirect target |
| `'not-found'` | `NotFoundComponent` | — | the one real 404 route |
| `'**'` | — | — | `redirectTo: 'not-found'`; **must stay last** |

### Boards feature (`features/boards/boards-routing.module.ts`, mounted at `boards`)

| Path (relative to `/boards`) | Renders | Guards | Notes |
|---|---|---|---|
| `''` | `BoardListComponent` | — | i.e. exactly `/boards` — public |
| `':boardId'` | `BoardDetailsComponent` | `authGuard` | the persistent board layout |
| `':boardId' → ''` | — | — | `redirectTo: 'overview'` |
| `':boardId/overview'` | `BoardOverviewComponent` | — | the four Kanban columns |
| `':boardId/columns/:columnId'` | `ColumnDetailsComponent` | — | one column's tasks |
| `':boardId/new-task'` | `AddTaskComponent` | — | dispatches `addTask` |
| `':boardId/tasks/:taskId'` | `TaskDetailsComponent` | `unsavedChangesGuard` | editable task form, dispatches `updateTask`/`deleteTask` |

Routes are matched **top to bottom, first match wins** — that's why `'not-found'` (a real, literal
path) is registered before the wildcard, and why `'**'` is always last: anything placed after a
wildcard route would never be reachable.

## SPA routing, in one paragraph

The Angular Router intercepts link clicks and programmatic navigation calls, matches the target URL
against the table above entirely in the browser, updates the address bar via the History API, and
swaps out whichever component is shown inside a `<router-outlet>` — all without a server
round-trip for the page itself. That's what makes this a Single Page Application: one HTML page is
served once, and the Router does the rest.

## `<router-outlet>` — root and nested

`AppComponent`'s template ([app.component.html](src/app/app.component.html)) has exactly one root
outlet, sitting below a `<header class="sidebar">` that is **never inside** the outlet — the
sidebar and its nav links stay mounted across every navigation; only the outlet's contents change.

`BoardDetailsComponent` ([board-details.component.html](src/app/features/boards/pages/board-details/board-details.component.html))
has a **second, nested** outlet, one level down. Its breadcrumb, board header and tab nav render
once and stay put while the nested outlet swaps between the overview, a single column, or a task —
visiting `/boards/1/tasks/1` renders `TaskDetailsComponent` *inside* the still-visible board
layout, not in place of it. That's the whole point of nested routing made visible on screen.

## `routerLink` — declarative navigation

Used everywhere a destination is already known in the template. A real example, the sidebar
([app.component.html](src/app/app.component.html)):

```html
<a routerLink="/boards" routerLinkActive="sidebar__link--active" ariaCurrentWhenActive="page">Boards</a>
```

Dynamic destinations use the array form, e.g. opening a column from the board's tab bar
([board-details.component.html](src/app/features/boards/pages/board-details/board-details.component.html)):

```html
<a *ngFor="let column of columns" [routerLink]="['columns', column.id]" ...>{{ column.name }}</a>
```

A few links — task links from the overview and column views, and the "back to overview"/"cancel"
links on the task form — build an **absolute** path (`['/boards', boardId, 'tasks', task.id]`)
instead of a relative one. That's a deliberate choice, not an oversight: see
[Common mistakes avoided](#common-mistakes-this-app-avoids) below.

## `routerLinkActive` — active navigation state

The sidebar's `Boards` link ([app.component.html](src/app/app.component.html)) uses
`[routerLinkActiveOptions]="{ exact: false }"` on purpose — it should stay visibly "active" while
browsing anywhere under `/boards/...`, not just at the exact `/boards` URL, because that whole
area *is* the Boards section from the user's point of view.

The board's own tab bar takes the opposite stance: `routerLinkActive` there (no `exact` override,
so it defaults to requiring an exact match) only lights up the tab whose URL is the current one —
`Overview` shouldn't look active while you're on the `In Progress` tab. Both are the same directive
used deliberately differently for two different UX needs.

`ariaCurrentWhenActive="page"` is set on both the sidebar links and the board tabs — this is
`RouterLinkActive`'s built-in accessibility hook: it sets `aria-current="page"` on the active link
automatically, so a screen reader announces "current page" the same way sighted users see the
highlighted style, without any extra code.

## Programmatic navigation

The `Router` service is injected and used only when navigation is a *consequence* of code running,
never as a substitute for a plain link:

| Where | Why programmatic |
|---|---|
| `BoardListComponent.createBoard()` | Only makes sense after the board is saved — no link exists for a board that doesn't exist yet |
| `BoardListComponent.openBoard()` | Backs the card's "Open board" button, so the whole card doesn't have to be one giant unlabeled link |
| `authGuard` | Returns a `UrlTree` (see [CanActivate](#canactivate--authguard)) rather than calling `router.navigate()` |
| `BoardDetailsComponent` / `ColumnDetailsComponent` / `TaskDetailsComponent` | Redirect to `/not-found` as a side effect of a failed board/column/task lookup |
| `SettingsComponent.logout()` | Logging out and leaving the page happen together, as one action |
| `LoginComponent.login()` | Sends the user to the validated `returnUrl` after logging in |

## Route parameters — read reactively, not from a snapshot

`:boardId`, `:columnId` and `:taskId` are all read via `route.paramMap.subscribe(...)`, never
`route.snapshot.paramMap.get(...)`. This matters concretely: navigating from `/boards/1/overview`
to `/boards/2/overview` matches the **same** route config, so Angular **reuses** the existing
`BoardDetailsComponent`/`BoardOverviewComponent` instances instead of destroying and recreating
them — `ngOnInit` does not run again. A snapshot read (taken once, at init) would keep showing
board 1's data forever after that; only a live subscription picks up the new id. Every subscription
is torn down in `ngOnDestroy`.

### Why `paramsInheritanceStrategy: 'always'` is set

By default, Angular only passes a parent route's params down to a child whose **own path is
empty**. `overview`, `columns/:columnId` and `tasks/:taskId` all have non-empty paths of their own,
so without this setting, none of their `paramMap`s would contain the parent's `:boardId` — every
one of those components would read `null` for it. `app.config.ts` sets:

```ts
provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' }))
```

This is the one global router configuration change in the app, and it exists for exactly this
reason — not added speculatively.

## Query parameters

`/boards` reacts to `?search=&filter=&sort=`, read via `route.queryParamMap.subscribe(...)` in
[board-list.component.ts](src/app/features/boards/pages/board-list/board-list.component.ts). Every
control (the search box, the filter and sort `<select>`s) writes back through one shared
`updateQuery()` helper using `router.navigate([], { queryParamsHandling: 'merge' })`, so the three
params can never drift out of sync with each other or with the URL — the exact list you're looking
at is always bookmarkable, survives a refresh, and works with back/forward.

`returnUrl` is a query parameter too, attached by `authGuard` and read (once, via
`route.snapshot`) by `LoginComponent` — see the next section for why it's validated before use.

## `CanActivate` — `authGuard`

```ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) return true;

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
```

It returns a `UrlTree`, rather than calling `router.navigate()` as a side effect and then
returning `false`. The router treats a returned `UrlTree` as the navigation's own redirect target,
resolved as part of the same navigation — calling `navigate()` separately starts a *second*,
independent navigation while the first is still being cancelled, and the two can race under load.
Applied to `boards/:boardId` and `settings`; `/boards` itself stays public.

### Simulated authentication — read this before trusting it

`AuthService.isLoggedIn()` is a boolean flag written to `sessionStorage`, with no server, no
password, and no session token. It's stored in `sessionStorage` only so a refresh during a demo
doesn't lose the "logged in" state — not for any security reason. **A route guard like this only
ever hides a screen from someone using the app normally; it cannot stop a request forged directly
against a real API.** Any actual authorization has to be enforced by the backend serving the data,
not by client-side routing.

## `CanDeactivate` — `unsavedChangesGuard`

```ts
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) return true;
  return window.confirm('You have unsaved changes. Leave this page and discard them?');
};
```

`TaskDetailsComponent` implements `HasUnsavedChanges` by keeping two copies of the form data: the
last-saved values (`saved`) and the live, editable ones (`draft`). `hasUnsavedChanges()` is a
straight comparison between them (`JSON.stringify(this.draft) !== JSON.stringify(this.saved)`); it
only returns `true` once something is actually different, not just because the form was touched.
Saving copies `draft` back into `saved`, which is what clears the "unsaved" state. Applied to
`tasks/:taskId`, this protects a routerLink click, a programmatic `navigate()`, and the browser's
back/forward buttons identically — the Router calls the same guard no matter what triggered the
navigation.

## Navigation events — `NavigationService`

[navigation.service.ts](src/app/core/services/navigation/navigation.service.ts) subscribes to `Router.events`
once, in its constructor (it's a root-provided singleton, so this subscription lives for the app's
whole lifetime — there's no `ngOnDestroy` for a service that never gets destroyed):

| Event | When it fires | What this app does |
|---|---|---|
| `NavigationStart` | A navigation has been triggered and is about to be resolved | sets `isNavigating = true`, clears any previous `navigationError` |
| `NavigationEnd` | The navigation succeeded and the new route is active | sets `isNavigating = false` |
| `NavigationCancel` | A guard rejected the navigation (e.g. `authGuard`/`unsavedChangesGuard` returning `false`) | sets `isNavigating = false` — no error, this is a normal outcome |
| `NavigationError` | Something actually threw — most plausibly a lazy chunk failing to load | sets `isNavigating = false`, sets a plain-language `navigationError` message, and logs the real error **once** with `console.error` |

`AppComponent` binds `navigation.isNavigating` to a thin top progress bar and
`navigation.navigationError` to a dismissable-by-navigating-away banner. There's no artificial
delay anywhere — the bar is only visible for as long as a real navigation actually takes.

## Lazy loading

```ts
{ path: 'boards', loadChildren: () => import('./features/boards/boards.module').then((m) => m.BoardsModule) }
```

`loadChildren` takes a function returning a **dynamic `import()`** rather than a static import at
the top of the file. Because the reference is inside a function that's only called when the router
actually needs it, the bundler (esbuild, via the Angular CLI) can see that `BoardsModule` — and
everything it and its five page components import — is only reachable through that one call, and
splits it into its own output file instead of folding it into the initial bundle. That's the whole
mechanism; "lazy" just means "not requested until this code path runs."

**What "the boards area" means here, precisely:** `BoardListComponent` itself lives inside
`BoardsModule`, so the lazy chunk downloads the moment you visit `/boards` — not only when opening
a specific board. It does **not** download for `/`, `/login`, `/settings`, or `/not-found`.

### How to verify it (both ways were actually run for this repo)

**1. Production build output.** `npm run build` prints something like:

```
Initial chunk files | Names | Raw size | ...
chunk-XXXXXXXX.js   | -     | 311 kB   | ...
main-XXXXXXXX.js    | main  | 46 kB    | ...

Lazy chunk files    | Names         | Raw size | ...
chunk-YYYYYYYY.js   | boards-module | 29 kB    | ...
```

The `boards-module` chunk is listed separately, under "Lazy chunk files" — it is not part of the
"Initial total".

**2. The browser Network panel.** Serve the production build locally (e.g.
`npx serve -s dist/kanban-task-management/browser`) and open DevTools → Network → filter by JS.
Visit `/login` — no request for the `boards-module` chunk appears. Now click into Boards — a new
JS request fires for exactly that chunk file, and only then. (This was verified for this repo with
a scripted Playwright network trace rather than manual clicking; see
[Manual verification checklist](#manual-verification-checklist).)

## Preloading

**Not configured in this project**, on purpose. Angular's `PreloadAllModules` strategy would fetch
every lazy chunk quietly in the background right after the app finishes its *initial* load — it
still avoids putting the boards feature in the *initial* bundle, but it would blur the specific
demonstration this lab is about: showing a lazy chunk request that fires exactly when you click
into Boards, in real time, in the Network panel. With preloading on, that request might already be
sitting in a "from disk cache"/prefetched state by the time you click, which makes the before/after
network evidence far less obvious to point at during a review. Eager loading (no lazy boundary at
all) is the other end of the spectrum this app also avoids — it would put the entire boards feature
in the initial bundle, which is the exact problem lazy loading exists to solve.

## Auxiliary (named) routes

**Not used in this project.** Angular supports rendering a second component alongside the primary
one via a second, *named* `<router-outlet name="...">` (e.g. a chat panel next to the main
content) — each named outlet gets its own segment in the URL and is driven by an `outlet` property
on a route config entry. Every screen in this app only ever needs one thing shown per outlet level
at a time (the board layout, or the task form inside it — never two independent things side by
side), so a normal nested *primary* outlet is the right tool; reaching for an auxiliary route here
would add a routing concept with nothing in the UI that actually needs it.

## State management

This is the second lab built on top of the routing app above: turning `BoardService` from a
synchronous in-memory object into a real (simulated) API, and putting boards/tasks under NgRx.

### What "application state" means

Application state is any data the app has to remember between renders — which boards exist, what
a task's title currently is, whether a request is in flight. It matters because the same piece of
state is usually needed in more than one place (the board list *and* each board's progress bar
both need to know how many tasks are done), and if two places each kept their own copy, they could
disagree. The fix is always the same shape: put the data in exactly one place, and have every
consumer read *from* that place instead of copying it.

### Local state vs. shared service state vs. global NgRx state

Three different answers to "where does this piece of state live?", all present in this app:

| Kind | Where it lives | Examples in this app |
|---|---|---|
| **Local component state** | A plain field on one component, never read anywhere else | `search`/`filter`/`sort` fields on `BoardListComponent` (mirrored from the URL); `draft`/`submitted` on `TaskDetailsComponent` and `AddTaskComponent`; `justSaved`; whether the unsaved-changes confirm has fired |
| **Shared service state** | A service with a `BehaviorSubject`, injected wherever it's needed | `NotificationService` — the one active toast message, used by `AppComponent` and dispatched into by `BoardsEffects` |
| **Global NgRx state** | The Store, reached through actions/reducers/selectors | Boards, tasks, `loading`, `error` — anything more than one route/component needs to read *and* that can change from more than one place |

The rule this app follows: if only one component ever reads a value, it's local. If several
unrelated components need the *same* live value and a plain shared subject is enough to keep them
in sync, a service is enough. If the data is also written from multiple places, needs a
predictable history of *how* it changed, and benefits from time-travel debugging, it goes in NgRx.

### Why boards and tasks use NgRx

Before this lab, `BoardService` held the boards/tasks arrays directly, and every component called
synchronous getter methods on it (`getBoards()`, `getTasksForBoard()`, …). That works until more
than one screen needs the *same* data to update at the same time — e.g. adding a task on the
add-task page needs to be reflected on the overview's kanban columns *and* the board list's
progress bar, without either page reaching into the other's component instance. NgRx gives every
one of those consumers the same read path (a selector) and the same write path (an action), so
"add a task" only has to be implemented once, in one effect, and every screen watching that data
reacts automatically.

### Why notifications use a `BehaviorSubject`, not NgRx

`NotificationService` ([notification.service.ts](src/app/core/services/notification/notification.service.ts))
is the one deliberate service-based state example, and it's a genuine contrast, not a shortcut:

- It's **transient, UI-only** state — "here's a toast to show right now" isn't a business fact
  worth an action/reducer/selector's worth of ceremony.
- Nothing needs to *read* the current notification except the one place that displays it
  (`AppComponent`).
- It's **write-only from one direction** (effects push messages) and **read-only from one
  direction** (the template) — exactly what a `BehaviorSubject` + `.asObservable()` is built for.

If boards/tasks were *also* kept in a `BehaviorSubject` alongside the NgRx store, there would be
two sources of truth for the same data — the one thing this design explicitly avoids (see
`BoardsEffects`' comment: *"One shared notification service reacts to every mutation's outcome"* —
notifications, not board/task data, is what flows through it).

### The complete data flow

```
Component → dispatch(action) → Effect → TaskService (HttpClient) → Success/Failure action
                                                                          ↓
Component ← template (async pipe) ← Selector ← Store ← Reducer (pure update)
```

Concretely, saving a task edit:

1. `TaskDetailsComponent.save()` dispatches `BoardsActions.updateTask({ task })` with the full
   edited task.
2. `BoardsEffects.updateTask$` — listening via `ofType(BoardsActions.updateTask)` — calls
   `TaskService.updateTask(task)`.
3. `TaskService` sends `PUT /tasks/:id`; the server returns the saved task.
4. The effect maps a success onto `BoardsActions.updateTaskSuccess({ task })`, or a thrown error
   onto `BoardsActions.updateTaskFailure({ error })` via `catchError`.
5. `boardsReducer` handles that action immutably — replacing just the one matching task, or storing
   the error string — and the Store holds a brand-new state object.
6. `BoardsSelectors.selectTaskByBoardAndId(boardId, taskId)` (and every other affected selector)
   recomputes and emits the new value.
7. `TaskDetailsComponent`'s subscription (and the async pipe wherever this data is displayed)
   receives the new value and the view updates — no manual `boardService.getTask(...)` call, no
   manually copying the updated task into local component state.

Add/delete follow the identical shape, just with `addTask`/`deleteTask` and their own
success/failure pair.

### NgRx building blocks used here

- **Store** — the single, app-wide state container. Configured with `provideStore()` at the root
  (`app.config.ts`) with no reducers of its own, plus `provideState(boardsFeatureKey, boardsReducer)`
  registered *lazily* inside `BoardsModule` — the 'boards' feature state only exists once `/boards`
  is actually visited, matching the lazy-loading story from the routing lab.
- **Actions** — [boards.actions.ts](src/app/features/boards/state/boards.actions.ts). Every write
  is a request/success/failure trio (`loadBoardData` / `…Success` / `…Failure`, and the same shape
  for `addBoard`, `addTask`, `updateTask`, `deleteTask`), named with a source tag —
  `[Boards Page]`, `[Task Form]`, `[Boards API]` — so the DevTools log reads like a sentence
  ("`[Task Form] Update Task`" → "`[Boards API] Update Task Success`"). Actions only describe
  *what happened*; there's no `if` statement anywhere in this file.
- **Reducers** — [boards.reducer.ts](src/app/features/boards/state/boards.reducer.ts), one
  `createReducer(...)` with an `on(...)` per action. See
  [Why reducers must be pure](#why-reducers-must-be-pure-and-immutable) below.
- **Selectors** — [boards.selectors.ts](src/app/features/boards/state/boards.selectors.ts). See
  [Why selectors](#why-selectors-instead-of-reading-the-whole-store) below.
- **Effects** — [boards.effects.ts](src/app/features/boards/state/boards.effects.ts), a single
  `BoardsEffects` class registered via `provideEffects(BoardsEffects)` in `BoardsModule`. See
  [Why API calls belong in Effects](#why-api-calls-belong-in-effects) below.

### Why reducers must be pure and immutable

A reducer is a synchronous function — `(state, action) => newState` — with no side effects: no
service calls, no `Date.now()`-style hidden randomness beyond what's already in the action payload,
no mutation of the state it was given. `boardsReducer` always returns a **new** object/array
(`{ ...state, ... }`, `state.tasks.map(...)`, `state.tasks.filter(...)`) instead of changing the
existing one in place. Two things depend directly on this:

- **Predictability.** Given the same starting state and the same action, a reducer always produces
  the same result — there's nothing hidden to cause a different outcome the second time.
- **Change detection and memoized selectors.** `updateTaskSuccess`'s handler only replaces the one
  task that changed (`state.tasks.map((t) => (t.id === task.id ? task : t))`) — every *other* task
  object keeps its original reference. That's what lets `createSelector`'s reference-equality
  memoization (and Angular's own change detection) skip recomputing/re-rendering things that didn't
  actually change.

This is also why `BoardService`'s mock-API methods always hand back a *copy* of a task/board,
never the object they still hold internally (see the comment above `loadBoards()`/`loadTasks()` in
[board.service.ts](src/app/core/services/board/board.service.ts)): NgRx's dev-mode runtime checks
deep-freeze the state tree to *catch* accidental mutation, and if the store's copy and the mock
API's own copy were the same object, freezing one would freeze the other — the next edit would
throw `Cannot assign to read only property`. Treating every value crossing the
service-to-store boundary as a fresh copy (exactly like a real HTTP response, which is always a
deserialized copy of server-side memory) avoids that entirely.

### Why API calls belong in Effects

A reducer *cannot* call a service or await anything — it has to return synchronously. Effects are
the place NgRx sets aside specifically for "something happened, now go do async work and dispatch
whatever the result was": `BoardsEffects.updateTask$` listens for `updateTask`, calls
`boardService.updateTask$(...)`, and maps the result onto `updateTaskSuccess`/`updateTaskFailure`
with `map`/`catchError`. This keeps components and reducers free of any knowledge of *how* the
mock API works, or that it's async at all — a component only ever dispatches an intent and reads a
selector.

Three different flattening operators are used deliberately, not arbitrarily:

- **`exhaustMap`** for `loadBoardData$` — if multiple pages dispatch a load while one is already in
  flight, later ones are ignored rather than queued, and if boards are already cached the effect
  resolves immediately without hitting the mock API again.
- **`concatMap`** for `addBoard$`/`addTask$`/`updateTask$`/`deleteTask$` — user-triggered writes
  keep the order the user triggered them in, rather than a `switchMap` silently cancelling an
  earlier save because a second one started.
- Non-dispatching effects (`navigateAfterAddBoard$`, `notifyOnSuccess$`, …) are declared with
  `{ dispatch: false }` — they perform a side effect (navigation, showing a toast) but don't feed
  anything back into the reducer.

### Why selectors instead of reading the whole Store

A component could technically do `store.select((state) => state.boards.boards)` inline everywhere
it needs boards, but then the *definition* of "all boards" (and worse, anything derived, like "a
board's progress") would be duplicated wherever it's used, with every copy able to quietly drift
out of sync. `boards.selectors.ts` defines each query exactly once —
`selectTasksForBoard(boardId, status?)`, `selectBoardProgress(boardId)`,
`selectFilteredBoardSummaries(query)` — and every component just asks for the slice/derivation it
needs. Selectors are also memoized: calling the same selector twice with an unchanged input
skips recomputation, which is what keeps re-render work proportional to what actually changed.

### Why the `async` pipe is preferred

Every list-driving observable in this app (`vm$`, `board$`, `tasksByColumn$`, `tasks$`) is read in
the template with `| async`, not a manual `.subscribe()` that copies the value into a field. The
`async` pipe subscribes when the template is created and **automatically unsubscribes when the
component is destroyed** — there's no `ngOnDestroy` boilerplate to remember, and no risk of a
leaked subscription still holding a reference to a destroyed component. The few places this app
*does* use an explicit `.subscribe()` (e.g. the redirect-on-not-found check in
`BoardDetailsComponent`/`TaskDetailsComponent`, or `ColumnDetailsComponent`'s eager validation
subscribe) are side effects with nothing to bind in a template — those use Angular's
`takeUntilDestroyed(DestroyRef)` for the same automatic-cleanup guarantee.

### Service-based state vs. NgRx: when to use each

| Question | Favors a service (`BehaviorSubject`) | Favors NgRx |
|---|---|---|
| Is this read from more than a couple of unrelated places? | Maybe | Yes |
| Is it written from more than one place (component, effect, guard)? | Rarely | Yes |
| Would you ever want to see *how* it changed over time (DevTools)? | No | Yes |
| Is it transient UI-only state (a toast, a modal's open/closed flag)? | Yes | Overkill |
| Does "undo"/time-travel debugging matter for it? | No | Yes |

This app draws that line at exactly one place: boards/tasks (read/written from many components,
worth inspecting in DevTools) go through NgRx; the current toast message (read by one component,
written only as a side effect) is a `BehaviorSubject`.

### NgRx DevTools

Registered in [app.config.ts](src/app/app.config.ts):

```ts
provideStore(),
provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode(), trace: false, traceLimit: 75 }),
```

`maxAge: 25` keeps the last 25 actions in the DevTools history (enough to walk through a full
load → edit → save sequence without the panel getting unwieldy). `logOnly: !isDevMode()` means the
extension can inspect state but can't dispatch/replay actions back into a production build — only
in `ng serve`'s development mode is it fully interactive. With the
[Redux DevTools browser extension](https://github.com/reduxjs/redux-devtools) installed, opening it
next to the running app shows every dispatched action, and clicking one shows the state
immediately before and after the reducer ran on it.

### State file responsibilities, exactly

| File | Responsibility |
|---|---|
| `boards.state.ts` | `BoardsState` shape (`boards`, `tasks`, `loading`, `error`), `initialBoardsState`, the `boardsFeatureKey` string, and the `BoardFilter`/`BoardSort`/`BoardQuery` types used by the list-filtering selector |
| `boards.actions.ts` | Every event this feature can dispatch — no logic |
| `boards.reducer.ts` | The one place `BoardsState` is ever computed — pure, synchronous |
| `boards.selectors.ts` | Every derived read — board/task lookups, progress, the filtered/sorted board list |
| `boards.effects.ts` | The one place `BoardService` is called from — turns a request action into a real (simulated) API call, then a success/failure action; also the navigation and notification side effects that follow a mutation |

### Known limitations (state management)

- **One `saving` flag for all writes.** The HTTP lab split the old single `loading` flag into
  `loading` (GET) and `saving` (POST/PUT/DELETE), but `saving` is still shared by every write —
  a larger app would track status per operation.
- **Production data resets on a full page reload.** On Netlify the in-memory API holds data in the
  browser, so a hard refresh re-seeds the original three boards. In development, json-server
  persists changes to `mock-api/db.json` until `npm run api` is restarted.
- **`selectFilteredBoardSummaries` is a selector *factory*, not a single memoized selector** —
  calling it again with a different query returns a brand-new selector. That's fine for this app's
  data size, but it means the search/filter/sort computation reruns on every query-param change
  rather than being cached across specific `(search, filter, sort)` combinations.

### Browser-to-code review walkthrough (state management)

1. Open `/boards` — the boards list briefly shows **"Loading boards…"**, then the three seeded
   boards render. That gap is `BoardService.loadBoards()`'s simulated 300ms delay, driven by
   `BoardsEffects.loadBoardData$`.
2. Open the browser's Redux DevTools panel — `[Boards Page] Load Board Data` appears, followed
   ~300ms later by `[Boards API] Load Board Data Success`; clicking the success action shows
   `loading: true → false` and `boards`/`tasks` populated in the diff.
3. Open a board, click **+ Add task**, submit a title. DevTools shows
   `[Task Form] Add Task` → `[Boards API] Add Task Success`; the app navigates back to the overview
   (via `BoardsEffects.navigateAfterAddTask$`) and a green **"Task added."** toast appears at the
   top (`NotificationService`, via `BoardsEffects.notifyOnSuccess$`).
4. Open that task, edit the title, save. The **Save changes** button stays disabled until something
   actually differs from the last save (`hasUnsavedChanges()`); after saving, a **"Saved."** badge
   appears only once `updateTaskSuccess` arrives — not the instant the button was clicked.
5. Click **Delete task**, confirm the dialog — the task disappears and the app returns to the
   overview.
6. Edit a task's title without saving, then click "Back to overview" — the browser's native confirm
   dialog (`unsavedChangesGuard`, unchanged from the routing lab) still fires.

### Requirement-to-file mapping (state management lab)

| Lab requirement | Where it's satisfied |
|---|---|
| Local vs. global state identified | [Local vs. shared vs. global](#local-state-vs-shared-service-state-vs-global-ngrx-state) table above |
| Service-based state with `BehaviorSubject` | `NotificationService` |
| NgRx Store configured | `provideStore()` in `app.config.ts` |
| NgRx feature store for boards/tasks | `provideState(boardsFeatureKey, boardsReducer)` in `BoardsModule` |
| Actions (request/success/failure) | `boards.actions.ts` |
| Reducers | `boards.reducer.ts` |
| Selectors | `boards.selectors.ts` |
| Effects for async API work | `boards.effects.ts` (`BoardsEffects`) |
| Async API | `BoardService`/`TaskService` — `HttpClient` calls returning Observables (HTTP lab) |
| Loading/error UI | `BoardListComponent`'s `vm$` (loading spinner + retry), `TaskDetailsComponent`/`AddTaskComponent`'s disabled-while-loading buttons |
| Notifications for success/failure | `BoardsEffects.notifyOnSuccess$`/`notifyOnFailure$` → `NotificationService` → `AppComponent`'s toast |
| Components dispatch/select instead of calling the service directly | Every `features/boards/pages/*` component — see each one's `ngOnInit` |
| `async` pipe / automatic unsubscription | `board$`, `tasksByColumn$`, `tasks$`, `vm$`, `notification$` all read via `| async`; the few manual subscriptions use `takeUntilDestroyed` |
| NgRx DevTools | `provideStoreDevtools(...)` in `app.config.ts` |
| Feature-module-aligned state organization | `features/boards/state/` — lazily registered inside `BoardsModule`, not the root |
| Tests for reducer/selectors/effects/service | `boards.reducer.spec.ts`, `boards.selectors.spec.ts`, `boards.effects.spec.ts`, `notification.service.spec.ts` |
| Deployment note | See [Deployment](#deployment-netlify) and [HTTP & APIs](#http--apis) for how the API works on Netlify |

## Accessibility decisions

- **Landmarks**: `<header class="sidebar">`, `<nav>` (both the sidebar and the board tabs), and
  `<main id="main-content">` structure every page.
- **Skip link**: the very first focusable element on any page
  ([app.component.html](src/app/app.component.html)) jumps straight to `#main-content`, so
  keyboard and screen-reader users don't have to tab through the sidebar on every navigation.
- **One `h1` per routed page** — verified across all six distinct page states (see
  [Manual verification checklist](#manual-verification-checklist)).
- **`aria-current="page"`** via `ariaCurrentWhenActive`, described above under `routerLinkActive`.
- **Real interactive elements**: every action is a `<button>` (task save, logout, "Open board") or
  an `<a routerLink>` (navigation) — nothing is a clickable `<div>`.
- **Labels**: every form control has an associated `<label>`, either via `for`/`id`
  (search, filter, sort, every task-form field, settings' display name) or by wrapping (the
  settings notification checkboxes).
- **Validation messaging**: the task title field sets `aria-invalid` and `aria-describedby`
  pointing at a visible `id="task-title-error"` message when left empty on submit — the error is
  both visible and announced, not color-only.
- **Focus states**: a single, consistent `:focus-visible` outline (in `styles.css`) applies to
  every link, button and form control, rather than relying on each browser's inconsistent default.
- **`prefers-reduced-motion`**: a global media query collapses all transition/animation durations
  to near-zero for anyone who has that OS setting on (`styles.css`).
- **Status is never color-only**: priority and status badges always carry their text label
  (`high priority`, `In Progress`, …) alongside the color.
- **Touch targets**: buttons, links and form controls all have a `min-height: 2.5rem` (40px) —
  comfortably inside typical mobile tap-target guidance.

## Responsive design decisions

- **Desktop/laptop**: a fixed 220px sidebar + fluid main content area
  ([app.component.css](src/app/app.component.css)).
- **≤768px**: the sidebar becomes a horizontal top bar (`flex-direction: row`, wrapping) instead of
  a slide-out drawer — navigation stays reachable with zero extra JS state to manage.
- **Board cards**: `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`, collapsing to a
  single column under 480px.
- **Kanban columns**: `grid-auto-flow: column` with a `minmax(260px, 1fr)` track and
  `overflow-x: auto` — four columns scroll horizontally rather than being squeezed unreadably
  narrow, which is the deliberate, common Kanban-on-mobile pattern.
- **Task form field pairs** (status/priority, assignee/due date) stack to one column under 480px.
- Verified at 375px width with **zero horizontal page overflow**
  (`document.documentElement.scrollWidth === clientWidth`, checked with a script — see below).

## Testing coverage

110 tests across 20 spec files:

- One spec per component/service/guard (`*.component.spec.ts`, `*.service.spec.ts`,
  `*.guard.spec.ts`) covering its own logic in isolation, generally with a stubbed `ActivatedRoute`
  where a component reads route/query params.
- **`app.routes.spec.ts`** — a dedicated, 15-scenario integration suite using Angular's
  `RouterTestingHarness`, run against the **real** `appConfig.providers` (the actual route table,
  the actual lazy `BoardsModule`, the actual guards, and now the actual NgRx store/effects) rather
  than a trimmed-down test-only route list. Each of the 15 required routing behaviors has its own
  `it(...)`, numbered to match:

  1. `/` redirects to `/boards`
  2. `/boards` renders the board list
  3. a valid `:boardId` displays the correct board (once authenticated)
  4. changing `:boardId` updates displayed content (the reuse-trap case)
  5. query params filter the board list
  6. the `overview` child route renders inside `BoardDetailsComponent`
  7. the `tasks/:taskId` child route renders the correct task
  8. `authGuard` permits an authenticated navigation
  9. `authGuard` redirects an unauthenticated one to `/login` with `returnUrl`
  10. logging in returns the user to that `returnUrl`
  11. `unsavedChangesGuard` allows navigation when nothing changed
  12. `unsavedChangesGuard` blocks/prompts, and respects cancel vs. confirm
  13. the registered `/not-found` route renders
  14. an unmatched URL reaches `/not-found` via the wildcard
  15. an invalid board id and an invalid task id are both handled intentionally

  Since board/task data now comes from the store via a simulated 300ms API call, this suite waits
  for real wall-clock time (`waitForBoardData(harness)`) after any navigation whose content depends
  on that data, instead of `fixture.whenStable()` — the Vitest/Vite test environment here doesn't
  run zone.js, so nothing tracks a plain `setTimeout`-based delay as "pending" the way a real
  zone.js-powered browser app does.

- **NgRx-specific specs**, one per state file:
  - `boards.reducer.spec.ts` — initial state, every request/success/failure handler, and explicit
    immutability assertions (a reducer call returns a new array reference; sibling items keep their
    original reference).
  - `boards.selectors.spec.ts` — every selector, including the board-progress derivation and the
    filtered/sorted board list.
  - `boards.effects.spec.ts` — each effect's success and failure path (using `provideMockActions` +
    `provideMockStore`), plus the "resolves from cache instead of calling the API" branch of
    `loadBoardData$`.
  - `notification.service.spec.ts` — the `BehaviorSubject`'s replay-to-new-subscriber semantics,
    `success()`/`error()`/`clear()`.
- Component specs for the refactored pages use `provideMockStore` (from `@ngrx/store/testing`) to
  assert on dispatched actions and rendered/selected state without exercising the real 300ms-delay
  effects — that end-to-end behavior is what `app.routes.spec.ts` covers instead.

`window.confirm` is mocked with `vi.spyOn` where needed and restored via `vi.restoreAllMocks()` in
an `afterEach`.

## Manual verification checklist

Everything below was **actually run** against this repo (a headless-browser script via Playwright,
driving both the dev server and a locally-served production build) — this is not a hypothetical
list.

- [x] `npm run build` succeeds; `boards-module` confirmed as a separate lazy chunk.
- [x] `npm test` — 20 files / 110 tests, all passing (see [State management manual
      verification](#state-management-manual-verification) below for the NgRx-specific browser run).
- [x] `/` → `/boards` redirect; board cards render.
- [x] `?search=mobile` narrows the board list to exactly the matching board.
- [x] Opening a board while logged out redirects to `/login?returnUrl=%2Fboards%2F1%2Foverview`.
- [x] Logging in returns to that exact board; document title updates (`Overview · FlowBoard`).
- [x] Breadcrumb, board tabs and all four Kanban columns render.
- [x] Clicking a column tab navigates to `/boards/1/columns/in-progress` and shows only that
      column's task.
- [x] Opening a task from the column view lands on `/boards/1/tasks/:id` with the form populated.
- [x] Editing the title, then navigating away: cancelling the confirm dialog keeps you on the task;
      confirming discards the edit and navigates through.
- [x] `/settings` while logged in renders; **Log Out** returns to `/boards`; `/settings` again then
      redirects to `/login`.
- [x] An unknown URL renders the custom 404 page with a working "Go to Boards" link.
- [x] Direct load of a deep nested URL (`/boards/1/tasks/1`), and a hard refresh on it, both work.
- [x] Browser back/forward between two boards updates the displayed board correctly both ways.
- [x] `aria-current="page"` is present on the active sidebar link.
- [x] Lazy chunk network evidence: 0 requests for it on `/login`, `/settings`, `/not-found`; exactly
      1 the moment `/boards` is visited (checked against the production build with request
      logging, not the dev server, since the dev server doesn't produce the same bundled chunks).
- [x] Deep-linking straight into `/boards/1/tasks/1` on the **production build served with an SPA
      fallback** (`serve -s`, the same rewrite `vercel.json` performs) renders the app instead of a
      server 404.
- [x] 375px viewport: `scrollWidth === clientWidth` (no horizontal overflow) on the board list,
      confirmed with a script rather than eyeballing it.
- [x] Skip link is the first Tab stop on every page.
- [x] `h1` count is exactly 1 on all six distinct page states (`/boards`, `/login`,
      `/boards/1/overview`, `/boards/1/tasks/1`, `/settings`, `/not-found`); zero form controls
      without an associated label.
- [x] Zero browser console errors across the entire scripted run.

### State management manual verification

Run against `npm start`'s dev server with a headless-browser (Playwright) script, driven through a
real login and a real create/add/edit/delete cycle — this is what actually caught the two bugs
described below before they shipped:

- [x] `/boards` shows a brief loading state, then all three seeded boards render (the simulated
      300ms `BoardService` delay is genuinely visible, not instant).
- [x] Searching `mobile` in the board list narrows it to exactly `Mobile App`.
- [x] Creating a board through the form dispatches `addBoard`, and the app navigates to the new
      board's own page only once `addBoardSuccess` actually arrives (not synchronously).
- [x] Opening a board renders its overview with all four Kanban columns and their tasks.
- [x] `+ Add task` → filling in a title → submit dispatches `addTask`, navigates back to the
      overview once `addTaskSuccess` arrives, and the new task appears in the correct column.
- [x] Editing a task's title and saving shows a **"Saved."** badge and a green **"Task saved."**
      toast at the top of the page (`NotificationService`, driven by `BoardsEffects`).
- [x] Deleting a task shows a native confirm dialog; confirming removes it and returns to the
      overview.
- [x] Editing a task without saving, then clicking "Back to overview", still triggers the
      browser's unsaved-changes confirm dialog — the `CanDeactivate` guard from the routing lab
      is unaffected by the NgRx refactor.
- [x] `/settings` still requires login and renders correctly afterward.
- [x] Zero browser console errors across the entire run.

Two real bugs were caught and fixed by this exact script, not by inspection alone:

1. **`BoardService`'s mock records got frozen.** The first save after a load threw
   `Cannot assign to read only property 'title'` — NgRx's dev-mode immutability check
   (`Object.freeze`) had frozen the *same* task object `BoardService` still held internally,
   because `loadTasks()` originally handed out the live objects instead of copies. Fixed by having
   every `BoardService` method return a fresh copy (see [Why reducers must be pure and
   immutable](#why-reducers-must-be-pure-and-immutable)).
2. **The "+ Add task" link briefly pointed at `/boards/undefined/new-task`.** `boardId` was being
   set inside the same async-piped observable that the "+ Add task" link (rendered *above* that
   async-gated block) depended on — so on first render, before that pipe's first subscriber-driven
   tick, the link's `boardId` was still unset. Fixed by eagerly subscribing to the route's
   `paramMap` in `ngOnInit` (mirroring how the original, pre-NgRx routing components read params) so
   `boardId` is set before the first render, not only once the template's own `| async` happens to
   subscribe. The same fix was applied to `BoardListComponent`'s search/filter/sort fields, which
   had the identical latent issue on a direct deep link like `/boards?filter=completed`.

## HTTP & APIs

This section covers the **HTTP & APIs lab**. Every code change for it is marked with an
`HTTP LAB` comment.

### Request flow

```
Component ──dispatch──▶ Effect ──calls──▶ BoardService / TaskService ──HttpClient──▶ REST API
    ▲                                                                                │
    └──── async pipe ◀── Selector ◀── Store ◀── Reducer ◀── Success/Failure action ◀──┘
```

Components never touch `HttpClient` or the data services. They dispatch actions and read
selectors, so the UI doesn't know or care which backend is answering.

### Which backend answers the requests

| | Development (`npm start`) | Production (`npm run build` / Netlify) |
|---|---|---|
| Environment file | `src/environments/environment.development.ts` | `src/environments/environment.ts` |
| `apiUrl` | `http://localhost:3000` | `/api` |
| Backend | **json-server** (`npm run api`) — a real REST server; requests visible in the Network tab | **angular-in-memory-web-api** — answers the same `HttpClient` requests inside the browser |
| Why | Real HTTP to inspect while developing | Netlify only hosts static files, so json-server can't run there |

`angular.json` swaps the environment files via `fileReplacements` (development configuration).
`app.config.ts` registers the in-memory API only when `environment.useInMemoryApi` is true. Both
backends read the same seed data (`mock-api/seed.json`). To use a real hosted API later, change
`apiUrl` in `environment.ts` and set `useInMemoryApi: false` — no service code changes.

json-server is pinned to `0.17.4` on purpose: the `1.x` beta generates string ids, while this app's
models and routes use numeric ids.

### Endpoints

| Operation | Request | Service method | Triggered from |
|---|---|---|---|
| Load boards | `GET /boards` | `BoardService.getBoards()` | Any boards page (once, then cached) |
| Load tasks | `GET /tasks` | `TaskService.getTasks()` | Same load, in parallel (`forkJoin`) |
| Create board | `POST /boards` | `BoardService.createBoard()` | "Create a new board" form |
| Delete board | `DELETE /tasks/:id` (each task), then `DELETE /boards/:id` | `TaskService.deleteTask()` + `BoardService.deleteBoard()` | **Delete** on a board card (confirm dialog) |
| Add task | `POST /tasks` | `TaskService.createTask()` | "Add task" form |
| Edit task | `PUT /tasks/:id` | `TaskService.updateTask()` | "Edit task" form |
| Delete task | `DELETE /tasks/:id` | `TaskService.deleteTask()` | **Delete task** (confirm dialog) |

### Error handling

- **In the services:** every request pipes through `catchError(handleHttpError('...'))`
  (`core/api/http-error.ts`), which turns an `HttpErrorResponse` into one readable sentence —
  e.g. status 0 → "The server is unreachable", 404 → "It no longer exists on the server".
- **GET requests retry once** (`retry(1)`) before failing — safe because reads have no side
  effects. Writes are never retried, to avoid creating duplicates.
- **In the Effects:** `catchError` turns the message into a `...Failure` action, so the Effect
  stream keeps working after an error.
- **In the UI:** failures show a red toast (`notifyOnFailure$`). A failed initial load also shows
  an inline message with a **Retry** button (`selectLoadError`); a successful retry clears the
  stale toast. A failed save keeps the form filled in, so nothing the user typed is lost.

### Loading states

- `loading` — true while the GET requests run → "Loading boards…" / "Loading board…".
- `saving` — true while a POST/PUT/DELETE runs → buttons disabled (prevents double submits),
  "Adding…" label on the add-task form.
- `loaded` — true once data has arrived. Pages redirect to `/not-found` only when `loaded` is true
  and the item is missing, so a network failure is never mistaken for "this task doesn't exist".

### Optimizing data handling (caching)

- **Store as cache:** every boards page dispatches `loadBoardData`, but `loadBoardData$` skips the
  HTTP calls when `loaded` is already true. Moving between pages makes **zero** extra requests.
- **`exhaustMap`** ignores a second load request while one is in flight (several components
  dispatch the load during the same navigation).
- **`forkJoin`** sends `GET /boards` and `GET /tasks` in parallel instead of one after another.
- **Server response is the source of truth:** after a POST/PUT the reducer stores what the server
  returned (including the generated id), so every component updates without a page reload.

### Why API logic is separated from components

- Components stay small: they describe *what* the user wants (an action), not *how* to fetch it.
- The backend can change (json-server → in-memory → real API) by editing environment files only.
- Each layer is tested on its own: services with `HttpTestingController` (exact method, URL, body
  and error mapping), effects with stubbed services, reducers as plain functions.

### Testing the API interactions

- `board.service.spec.ts` / `task.service.spec.ts` — one test per verb (GET, POST, PUT, DELETE)
  plus error/retry cases, using `HttpTestingController`.
- `boards.effects.spec.ts` — success, failure and cache paths, and the delete-board cascade.
- `app.routes.spec.ts` — end-to-end through real `HttpClient` requests answered by the
  in-memory API.
- **Manually verified in a browser:** with json-server, the Network tab showed `GET /boards` and
  `GET /tasks` once, then `POST /boards` → 201, `POST /tasks` → 201, `PUT /tasks/14` → 200,
  `DELETE /tasks/14` → 200 and `DELETE /boards/4` → 200, with no console errors. Stopping
  json-server showed "The server is unreachable" with Retry; restarting it and clicking Retry
  recovered. The production build (in-memory API) was served locally, and create/edit worked
  there with no console errors.

### Lab-task-to-file mapping (HTTP lab)

| Lab task | Where |
|---|---|
| 1. Review & preparation | Replaced the fake `of(...).pipe(delay())` service with real HTTP |
| 2. Enable HttpClient + config | `provideHttpClient()` in `app.config.ts`; `core/api/api.config.ts`; `src/environments/` |
| 3. Data service layer | `core/services/board/board.service.ts`, `core/services/task/task.service.ts` |
| 4. Retrieve & display | `loadBoardData$` effect + selectors; empty states in the board list and columns |
| 5. Forms → API | `AddTaskComponent` (POST), `TaskDetailsComponent` (PUT), create-board form (POST) |
| 6. Deletion & updates | Delete task / delete board with `window.confirm`; reducers apply server responses |
| 7. Errors & loading | `core/api/http-error.ts`, `retry(1)`, `loading`/`saving`/`loaded` flags, toasts, Retry |
| 8. Optimization | Store cache + `exhaustMap` + `forkJoin` (see above) |
| 9. Testing | Service, effect, reducer and routing specs (see above) |
| 10. Deployment | `netlify.toml` (unchanged) + the production environment uses the in-memory API |
| Bonus: environments | `environment.ts` / `environment.development.ts` + `fileReplacements` in `angular.json` |

## Deployment (Netlify)

### Build command

```bash
npm run build
```

### Publish directory

`dist/kanban-task-management/browser` — this is Angular's default application-builder output
layout (`dist/<project-name>/browser`); nothing in `angular.json` overrides it, and `netlify.toml`
points at exactly this path.

### `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist/kanban-task-management/browser"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Why the redirect is required

This is a client-side-routed SPA: the server only ever has one real HTML file, `index.html`. A
direct request to, say, `/boards/1/overview` or `/settings` has no matching file on disk — without
the redirect, Netlify would return a genuine server 404 before Angular's own code ever got a chance
to run and render its *own* not-found page. The redirect tells Netlify "serve `index.html` for any
path that doesn't match a real file" — Netlify checks the filesystem for actual built assets (JS,
CSS, the favicon) *before* falling back to this rule, so it doesn't interfere with those loading
correctly.

### API in production

Nothing extra is needed on Netlify: `npm run build` uses `environment.ts`, which turns on the
in-memory API, so `/api/boards` and `/api/tasks` are answered inside the browser. After deploying,
create a board, add/edit/delete a task, and check the toasts — that verifies the API integration
on the live site.

### Testing deployed deep links

After deploying, open each of these directly (paste the full URL, don't navigate there by
clicking) and confirm each one renders the app rather than a platform 404 page:

- `/boards`
- `/boards/1/overview`
- `/boards/1/tasks/1`
- `/settings` (should redirect to `/login`, since a fresh page load has no session)

### Exact commands to run

```bash
# from the project root
git add -A
git commit -m "<describe the change>"
git push

# Netlify CLI, if you use it locally instead of the dashboard
npx netlify init    # first deploy — link the project to a Netlify site
npx netlify deploy --prod # promote to production
```

If the GitHub repo is already linked to a Netlify site, pushing to the tracked branch triggers the
redeploy automatically — no CLI needed.

> A `vercel.json` is also kept in the repo root from an earlier deployment target; it's inert on
> Netlify and can be removed once Netlify is confirmed as the only target.

## Known limitations

- Authentication is entirely simulated and client-side — see the callout under
  [CanActivate](#canactivate--authguard). Never treat this pattern as real security.
- On the deployed site the API is the in-browser mock (`angular-in-memory-web-api`), so data
  resets on a full page reload. Pointing `environment.ts` at a hosted backend removes this.
- `computeBoardProgress`'s derived "active"/"completed" board status (in `boards.selectors.ts`) is a
  simple heuristic (all tasks done vs. not), not a real project-management concept like a formal
  board archive state.
- No automated accessibility audit tool (e.g. axe) was run — the accessibility checklist above was
  verified manually/by script, not by an automated scanner.
- See also [Known limitations (state management)](#known-limitations-state-management) for the
  shared `loading`/`error` flag and the selector-factory tradeoff specific to the NgRx work.

## Lab-task-to-implementation mapping

| Lab requirement | Where it's satisfied |
|---|---|
| SPA architecture | `app.config.ts` (`provideRouter`), `AppComponent`'s single root outlet |
| Organized route configuration | `app.routes.ts` (top level) + `boards-routing.module.ts` (feature) kept separate |
| Static routes | `'settings'`, `'login'`, `'not-found'` in `app.routes.ts` |
| Redirect routes | `'' → 'boards'`, `'**' → 'not-found'`, `':boardId' → 'overview'` |
| Wildcard route | `'**'`, last entry in `app.routes.ts` |
| Declarative navigation (`routerLink`) | sidebar, board tabs, board cards' internal links, task/column links |
| Active indicators (`routerLinkActive`) | sidebar (non-exact) and board tabs (exact), both with `ariaCurrentWhenActive` |
| Programmatic navigation (`Router`) | table under [Programmatic navigation](#programmatic-navigation) |
| Route parameters | `:boardId`, `:columnId`, `:taskId` |
| Query parameters | `?search=&filter=&sort=` on `/boards`, `?returnUrl=` on `/login` |
| Reactive parameter response | every `paramMap`/`queryParamMap` `.subscribe()` call — see [Route parameters](#route-parameters--read-reactively-not-from-a-snapshot) |
| Child routes | `overview` / `columns/:columnId` / `tasks/:taskId` under `:boardId` |
| Nested `router-outlet` | `BoardDetailsComponent`'s own outlet |
| Lazy loading | `loadChildren` → `BoardsModule`; see [Lazy loading](#lazy-loading) |
| Lazy-loaded feature module | `BoardsModule` + `BoardsRoutingModule` |
| `CanActivate` | `authGuard` |
| `CanDeactivate` | `unsavedChangesGuard` |
| Navigation events | `NavigationService` |
| Route error handling | `NavigationError` handling in `NavigationService`; invalid-id redirects to `/not-found` |
| Routing tests | `app.routes.spec.ts` (15 scenarios) + per-component specs |
| Deployment fallback config | `netlify.toml` |

## Assessment-criterion evidence

| Criterion | Evidence |
|---|---|
| Route configuration | Two-level route table (above), literal-before-wildcard ordering, page titles on every route |
| Navigation implementation | `routerLink` + `routerLinkActive` (two deliberately different configurations) + 6 real programmatic-navigation call sites |
| Advanced routing patterns | Real `loadChildren` module, two levels of nested child routes, a genuinely necessary global router config change (`paramsInheritanceStrategy`) |
| Route guards & security | `CanActivate` returning a `UrlTree`, `CanDeactivate` with a real dirty-check (not just "was touched"), an explicit open-redirect fix on `returnUrl`, and an explicit written limitation on what client-side guards can't do |
| Code structure & best practices | `core`/`pages`/`features` separation, single-responsibility components, no duplicated mock data (one `BoardService`), strongly-typed models, no `any` |

## Review questions with short answers

**What does the Angular Router actually do?** Matches the current URL against a route table
client-side, updates the browser's address bar, and swaps the component shown in a
`<router-outlet>` — no full page reload.

**Why is `'**'` last in the route array?** Matching is first-match-wins, top to bottom; anything
placed after `'**'` could never be reached because the wildcard would already have matched.

**Why does `BoardDetailsComponent` have its own `<router-outlet>`?** So its header, breadcrumb and
tabs can stay mounted while `overview`/a column/a task swaps underneath them — that's the entire
value of nested routing over one flat route list.

**Why read `paramMap` reactively instead of with `route.snapshot`?** Because Angular reuses a
routed component when only its route params change (e.g. Next/Previous board) — `ngOnInit` won't
run a second time, so a one-time snapshot read would silently go stale.

**Why does `authGuard` return a `UrlTree` instead of calling `router.navigate()` and returning
`false`?** So the redirect is resolved as part of the *same* navigation instead of kicking off a
second, separate one — avoids a race between the original navigation being cancelled and the
redirect starting.

**Is the login here real?** No — explicitly simulated, client-side only, documented as such in the
UI copy, the code comments, and this README's [limitations](#known-limitations) section.

**What does `loadChildren` actually change at build time?** It turns a static reference into a
dynamic `import()`, which lets the bundler split that code (and its dependencies) into a separate
output file that's only requested at runtime, when the router needs it.

**Why is `PreloadAllModules` not enabled?** It would still avoid the initial bundle, but it would
also blur the demonstration this lab centers on — a lazy chunk request firing at the exact moment
you navigate into Boards, visible live in the Network panel.

**What would happen without `withRouterConfig({ paramsInheritanceStrategy: 'always' })`?** Every
child of `:boardId` (`overview`, `columns/:columnId`, `tasks/:taskId`) has its own non-empty path,
so by default none of them would inherit `:boardId` from the parent — they'd all read `null` for
it.

**Why do some task/column links use an absolute path (`/boards/:boardId/...`) instead of a relative
one?** Relative `../` segment-counting got genuinely confusing (and, in testing, wrong) once a
sibling route's own `path` contains multiple slash-separated segments, like `columns/:columnId`.
Building the absolute path from `boardId` (already known in every one of these components) is both
simpler to read and impossible to miscount.

**Why does adding a board/task navigate from an *effect*, not the component that dispatched the
action?** The new board/task's id doesn't exist until the mock API responds — the component can't
build a URL to it the instant it dispatches. `BoardsEffects.navigateAfterAddBoard$`/
`navigateAfterAddTask$` wait for the matching success action (which carries the real, API-assigned
object) and navigate then, declared `{ dispatch: false }` since navigating isn't a state change.

**Why does `BoardService` return a *copy* of every board/task instead of the object it holds
internally?** Because NgRx deep-freezes state in dev mode to catch accidental mutation — if the
store's copy and the service's own record were literally the same object, freezing one would freeze
the other, and the next `Object.assign` inside `updateTask$` would throw. This actually happened
during this build and is described in [State management manual
verification](#state-management-manual-verification).

**Why is `search`/`filter`/`sort` still local component state instead of NgRx, when boards/tasks
aren't?** They're not *data* — they're *how the current user wants to view data that's already in
the URL*. Nothing else in the app reads them, and they already have a single source of truth (the
query string) that NgRx would just duplicate.

**What's the actual difference between `NotificationService` and the NgRx store, mechanically?** A
`BehaviorSubject` only replays its *latest* value to a new subscriber and has no concept of
actions/history — perfect for "the current toast," wrong for "every board and task, with a
debuggable history of every change," which is what the Store's action log gives you for free.

**Why do `BoardDetailsComponent` and `TaskDetailsComponent` wait for `loading` to be `false` before
redirecting to `/not-found`?** Because right after dispatching `loadBoardData`, the board/task
genuinely isn't in the store yet — redirecting immediately would send every valid board to
`/not-found` for the ~300ms the mock API takes to respond. The redirect only fires once loading has
actually finished and the item still isn't there.

## Things I must be able to explain (checklist)

- [ ] The full route table, both levels, and why the wildcard is last.
- [ ] What `<router-outlet>` does, and why `BoardDetailsComponent` has a second one.
- [ ] The difference between `routerLink` and `Router.navigate()`/`navigateByUrl()`, with a real
      example of each from this repo.
- [ ] `routerLinkActive`, and why the sidebar uses non-exact matching while the board tabs don't.
- [ ] Why route params are read via `.subscribe()`, with the Next-board "reuse trap" as the
      concrete failure case a snapshot read would hit.
- [ ] Where query params are used (`search`/`filter`/`sort`, `returnUrl`) and why they're query
      params rather than route params (they're not *which resource*, they're *how to view it*).
- [ ] Why `paramsInheritanceStrategy: 'always'` was needed, specifically.
- [ ] Why `tasks/:taskId` is nested under `:boardId` instead of being a flat sibling route.
- [ ] What `loadChildren` does, and both pieces of evidence that it's actually working (build
      output + Network panel).
- [ ] Both guards: what each one checks, what it returns on denial, and how a component opts into
      `CanDeactivate` via `HasUnsavedChanges`.
- [ ] Why `authGuard` returns a `UrlTree` instead of navigating manually and returning `false`.
- [ ] That the authentication here is simulated, and specifically *why* a client-side guard isn't
      real security.
- [ ] How `NavigationService` turns Router events into the loading bar and the error banner.
- [ ] Why preloading and auxiliary routes aren't used here, in this app's own terms — not just "the
      docs say so."
- [ ] The full data flow, in order: component dispatch → effect → `BoardService` → success/failure
      action → reducer → selector → template (`async` pipe).
- [ ] Why boards/tasks are in NgRx but notifications are a `BehaviorSubject` — the actual
      distinguishing questions from [Service-based state vs. NgRx](#service-based-state-vs-ngrx-when-to-use-each),
      not just "one is bigger."
- [ ] Why reducers must be pure/synchronous, and what would break if `updateTaskSuccess`'s handler
      mutated `state.tasks` in place instead of returning a new array.
- [ ] Why `BoardsEffects` calls `BoardService`, not the other way around, and what `exhaustMap` vs.
      `concatMap` buys you for `loadBoardData$` vs. the mutation effects.
- [ ] Where every action/reducer/selector/effect for this feature lives, and why that state is
      registered inside `BoardsModule` rather than `app.config.ts`.
- [ ] How to open NgRx DevTools and point at a specific action's before/after state diff.
- [ ] The two real bugs this refactor produced (frozen mock-API objects; a `boardId` link rendering
      before its async-piped value was set) and, concretely, what fixed each one.

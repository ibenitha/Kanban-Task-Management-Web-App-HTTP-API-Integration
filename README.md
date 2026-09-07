# FlowBoard

A Kanban task board built specifically to practice **Angular Routing and Navigation**. It's a
routing-focused lab, not a production task manager — the data is in-memory, "login" is simulated,
and there's no backend. Everything about *how you move between screens* is real, though: route
configuration, guards, lazy loading, nested routes, and reading the URL reactively.

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
- 63 tests across 15 spec files, including a 15-scenario routing integration suite run against the
  real route configuration.

## Technology versions

| Tool | Version |
|---|---|
| Angular CLI | 22.1.6 |
| Angular (core, router, forms, common, platform-browser) | 22.1.3 |
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

```bash
npm start
```

Open `http://localhost:4200`.

## Running tests

```bash
npm test
```

Runs the full Vitest suite once (non-watch). All 15 spec files / 63 tests should pass.

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
├── app.config.ts                  provideRouter() registration
│
├── core/
│   ├── models/
│   │   ├── board.model.ts         Board interface
│   │   ├── task.model.ts          Task interface + TaskStatus/TaskPriority union types
│   │   └── column.model.ts        Column interface (id is just a TaskStatus)
│   ├── services/                  each service in its own folder, alongside its own spec
│   │   ├── board/board.service.ts       Single source of truth for board/task data + queries
│   │   ├── auth/auth.service.ts         Simulated isLoggedIn()/login()/logout(), sessionStorage-backed
│   │   └── navigation/navigation.service.ts  Router-events → loading indicator + error state
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
    ├── boards.module.ts            NgModule that imports the (standalone) page components
    ├── boards-routing.module.ts    RouterModule.forChild() route table for this feature
    └── pages/
        ├── board-list/             '' (i.e. /boards) — search/filter/sort, create a board
        ├── board-details/          ':boardId' — persistent layout, breadcrumb, tabs, nested outlet
        ├── board-overview/         'overview' — the four-column Kanban board
        ├── column-details/         'columns/:columnId' — one column's tasks
        └── task-details/           'tasks/:taskId' — editable task form, CanDeactivate
```

### What each folder is responsible for

- **`core/models`** — plain TypeScript interfaces and union types. No behavior, just shapes.
- **`core/services`** — the only place that owns data or app-wide state. Every component injects
  `BoardService`/`AuthService` rather than keeping its own copy, so there is exactly one source of
  truth.
- **`core/guards`** — functional route guards, plus the small `HasUnsavedChanges` contract a
  component implements to opt into `unsavedChangesGuard`.
- **`core/utils`** — a single, tested helper (`isSafeInternalUrl`) with no framework dependencies.
- **`pages/*`** — routes that don't belong to any particular feature and don't need lazy loading
  (they're tiny, and loading them lazily would just add a network round-trip for no benefit).
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
| `':boardId/tasks/:taskId'` | `TaskDetailsComponent` | `unsavedChangesGuard` | editable task form |

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

63 tests across 15 spec files:

- One spec per component/service/guard (`*.component.spec.ts`, `*.service.spec.ts`,
  `*.guard.spec.ts`) covering its own logic in isolation, generally with a stubbed `ActivatedRoute`
  where a component reads route/query params.
- **`app.routes.spec.ts`** — a dedicated, 15-scenario integration suite using Angular's
  `RouterTestingHarness`, run against the **real** `appConfig.providers` (the actual route table,
  the actual lazy `BoardsModule`, the actual guards) rather than a trimmed-down test-only route
  list. Each of the 15 required routing behaviors has its own `it(...)`, numbered to match:

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

`window.confirm` is mocked with `vi.spyOn` where needed and restored via `vi.restoreAllMocks()` in
an `afterEach`.

## Manual verification checklist

Everything below was **actually run** against this repo (a headless-browser script via Playwright,
driving both the dev server and a locally-served production build) — this is not a hypothetical
list.

- [x] `npm run build` succeeds; `boards-module` confirmed as a separate lazy chunk.
- [x] `npm test` — 15 files / 63 tests, all passing.
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

## Deployment (Vercel)

### Build command

```bash
npm run build
```

### Output directory

`dist/kanban-task-management/browser` — this is Angular's default application-builder output
layout (`dist/<project-name>/browser`); nothing in `angular.json` overrides it, and `vercel.json`
points at exactly this path.

### `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/kanban-task-management/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Why the rewrite is required

This is a client-side-routed SPA: the server only ever has one real HTML file, `index.html`. A
direct request to, say, `/boards/1/overview` or `/settings` has no matching file on disk — without
the rewrite, Vercel would return a genuine server 404 before Angular's own code ever got a chance
to run and render its *own* not-found page. The rewrite tells Vercel "serve `index.html` for any
path that doesn't match a real file" — Vercel checks the filesystem for actual built assets (JS,
CSS, the favicon) *before* falling back to this rule, so it doesn't interfere with those loading
correctly.

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
git commit -m "<see the recommended message below>"
git push origin <your-branch>

# Vercel CLI, if you use it locally instead of the dashboard
npx vercel        # first deploy — link the project
npx vercel --prod # promote to production
```

(No deployment or GitHub push was performed by this session — see the final report for the
recommended commit message and next steps.)

## Known limitations

- Authentication is entirely simulated and client-side — see the callout under
  [CanActivate](#canactivate--authguard). Never treat this pattern as real security.
- Data is in-memory and resets on every full page reload (a hard refresh, not a route navigation).
  This is intentional for a routing lab — adding persistence would be solving a different problem.
- `getBoardProgress`'s derived "active"/"completed" board status is a simple heuristic (all tasks
  done vs. not), not a real project-management concept like a formal board archive state.
- No automated accessibility audit tool (e.g. axe) was run — the accessibility checklist above was
  verified manually/by script, not by an automated scanner.

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
| Deployment fallback config | `vercel.json` |

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

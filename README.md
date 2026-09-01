# Kanban Task Management

A simplified Kanban board app built to practice **Angular Router and Navigation**:
route configuration, all three navigation mechanisms (`routerLink`,
`routerLinkActive`, the `Router` service), reactive route/query parameters,
nested child routes, lazy loading, and route guards (`CanActivate` and
`CanDeactivate`).

Every file is commented at the point where something non-obvious happens, so
it can be read top-to-bottom and explained in a code review without extra
context.

## Running it locally

```bash
npm install
npm start        # ng serve — open http://localhost:4200
npm test         # unit tests (Vitest)
npm run build    # production build, output in dist/kanban-task-management/browser
```

## Project structure

```
src/app/
├── app.component.ts/html/css      Root layout: persistent header/nav + <router-outlet>
├── app.routes.ts                  Top-level route configuration
├── app.config.ts                  provideRouter() registration
│
├── core/
│   ├── models/
│   │   ├── board.model.ts         Board interface
│   │   └── task.model.ts          Task interface + TaskStatus union type
│   ├── services/
│   │   ├── board.service.ts       In-memory board/task data + CRUD-ish methods
│   │   └── auth.service.ts        Hard-coded isLoggedIn()/login()/logout()
│   └── guards/
│       ├── auth.guard.ts          authGuard — CanActivate
│       └── unsaved-changes.guard.ts  unsavedChangesGuard — CanDeactivate
│
├── pages/                         Top-level routed pages (not lazy-loaded)
│   ├── board-list/                Route ''/'boards' — all boards, sort, create
│   ├── login/                     Route 'login' — guard redirect target
│   ├── settings/                  Route 'settings' — guarded
│   └── not-found/                 Route '**' — wildcard 404
│
└── features/board/                Lazily-loaded "board" feature area
    ├── board.routes.ts            BOARD_ROUTES — the lazy-loaded route table
    ├── board-detail/               '' → board layout, task list, next/prev links,
    │                                own nested <router-outlet>
    └── task-detail/                'tasks/:taskId' → editable task, CanDeactivate
```

## Route table

| Path | Renders | Guards | Notes |
|---|---|---|---|
| `''` | — | — | `redirectTo: 'boards'` |
| `'boards'` | `BoardListComponent` | — | public — anyone can browse the list |
| `'boards/:boardId'` | (lazy) `BOARD_ROUTES` | `authGuard` | see below |
| `'settings'` | `SettingsComponent` | `authGuard` | protected |
| `'login'` | `LoginComponent` | — | the guard's redirect target |
| `'**'` | `NotFoundComponent` | — | wildcard, must stay last |

`features/board/board.routes.ts` (lazily loaded, mounted under `boards/:boardId`):

| Path (relative) | Renders | Guards | Notes |
|---|---|---|---|
| `''` | `BoardDetailComponent` | — | matches `boards/:boardId` itself |
| `'tasks/:taskId'` | `TaskDetailComponent` | `unsavedChangesGuard` | nested child route |

Routes are matched top to bottom, first match wins — literal paths are
registered before parameterized ones, and the wildcard `'**'` is always last.

## Two `<router-outlet>`s, on purpose

`AppComponent`'s template has one root `<router-outlet>`, below a `<header>`
that's never inside the outlet — so the nav stays mounted across every
navigation; only the outlet's contents swap.

`BoardDetailComponent` has its own second, nested `<router-outlet>`. That's
what lets `tasks/:taskId` render *inside* the board's layout (header, task
list) instead of replacing it — visiting `/boards/1` alone leaves that inner
outlet empty; visiting `/boards/1/tasks/1` renders `TaskDetailComponent` into
it while the board header and task list stay exactly where they were.

## Navigation: `routerLink` vs. the `Router` service

`routerLink` is used everywhere a template has a fixed or click-driven
destination: static (`app.component.html`), dynamic array form (board cards,
next/previous board links, task rows), and with query params (the sort
toggle on the board list).

`routerLinkActive` highlights the current section — see the `Boards` link in
`app.component.html`. It uses `{ exact: true }` so it doesn't also light up
on `/boards/1` or `/boards/1/tasks/1`.

The `Router` service is injected and used only when navigation is a
*consequence* of something happening in code, not a direct link click:

| Where | Why programmatic |
|---|---|
| `BoardListComponent.createBoard()` | Only makes sense after the board is saved — no link exists for a board that doesn't exist yet |
| `authGuard` | Redirecting to `/login` happens inside a guard function, not a template |
| `BoardDetailComponent` / `TaskDetailComponent` (bad id) | Redirects to `/not-found` as a side effect of a failed lookup |
| `SettingsComponent.logout()` | Logging out and leaving the page happen together, as one action |
| `LoginComponent.login()` | Sends the user back to `returnUrl` after a successful login |

## Route parameters — read reactively, not via snapshot

`:boardId` (`BoardDetailComponent`) is read via `route.paramMap.subscribe(...)`,
not `route.snapshot`. This matters concretely: clicking "Next board" navigates
from `/boards/1` to `/boards/2`, which matches the *same* route config, so
Angular **reuses** the existing component instance instead of destroying and
recreating it — `ngOnInit` does not run again. A snapshot-only read (taken
once, on init) would keep showing board 1's data forever; only a live
subscription picks up the new id. The subscription is torn down in
`ngOnDestroy`.

`:taskId` (`TaskDetailComponent`) is read the same way, alongside the
inherited `:boardId`, off the same `paramMap`.

Query parameters (`?sort=name`/`?sort=recent`) drive the board list's sort
order, read via `queryParamMap`. `returnUrl` (read by `LoginComponent`) is a
query parameter too — `authGuard` sets it when it redirects.

**A real router-config gotcha, found and fixed during testing:** by default,
Angular only passes a parent route's params down to a child if the child's
own path is empty (`paramsInheritanceStrategy: 'emptyOnly'`). Because
`tasks/:taskId` has a non-empty path of its own, it would **not**
automatically receive `:boardId` from its ancestor — every task click would
silently redirect to the 404 page. `app.config.ts` sets
`provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' }))`
to fix this globally.

## Lazy loading

```ts
{
  path: 'boards/:boardId',
  canActivate: [authGuard],
  loadChildren: () => import('./features/board/board.routes').then((m) => m.BOARD_ROUTES),
}
```

The entire "board" feature — `BoardDetailComponent`, `TaskDetailComponent`,
and everything they import — is not part of the initial bundle. `ng build`
confirms this: `board-routes` is listed as a separate lazy chunk, outside the
initial bundle.

## Route guards

**`authGuard`** (`CanActivate`, functional) — applied to `boards/:boardId`
and `settings`. On denial it doesn't just return `false` — it redirects to
`/login`, carrying the originally-requested URL as `returnUrl`, so logging in
sends the user straight back where they meant to go.

**`unsavedChangesGuard`** (`CanDeactivate`, functional) — applied to
`tasks/:taskId`. `TaskDetailComponent` implements `hasUnsavedChanges()` by
comparing its editable draft fields against the underlying `Task`; the guard
only prompts (`window.confirm`) when there's an actual difference — whether
the user clicks a `routerLink`, navigates programmatically, or hits the
browser's back button.

## Change detection: this app runs on classic zone.js, on purpose

Recent Angular CLI defaults to a signal-based, zoneless setup. This lab
deliberately avoids Signals (see below), and the reactive-`paramMap`-subscribe
pattern above only auto-refreshes the view under classic zone-based change
detection — a plain property reassignment inside a `.subscribe()` callback
doesn't otherwise notify a zoneless app that anything changed. `zone.js` is
imported at the top of `main.ts` for exactly this reason.

## What's deliberately *not* used

No Signals (`signal()`/`computed()`/`effect()`/`input()`), no RxJS
`Subject`/`BehaviorSubject` or operators (`map`, `switchMap`, …), no
`HttpClient`, and no new `@if`/`@for`/`@switch` control-flow syntax — classic
`*ngIf`/`*ngFor` (via `CommonModule`) are used throughout instead, to match a
curriculum scoped to standalone components, property/event/two-way binding,
services with `providedIn: 'root'`, `ngOnInit`/`ngOnDestroy`, and the Router
APIs above. The one deliberate exception is `CanDeactivate`: structurally the
same mechanism as `CanActivate` (a functional guard returning `true`/`false`),
just answering "can I leave" instead of "can I enter" — required by the task
brief, not a new paradigm.

## Trying it out

- Browse `/boards` without logging in — the list itself is public.
- Click into any board — `authGuard` redirects you to `/login`, then back to
  that exact board after you click **Log In**.
- Click **Next board →** / **← Previous board** and watch the content update
  without a full reload (the "reuse trap" in action).
- Open a task, edit its title or description, then click **← All boards** —
  a confirm dialog blocks the navigation until you decide.
- Visit `/settings`, click **Log Out**, then try `/settings` again — you're
  sent back to `/login`.
- Visit an unknown URL, e.g. `/nonsense` — the custom 404 page renders.

## Deployment

`netlify.toml` and `vercel.json` both rewrite every path to `index.html`,
which this client-side-routed SPA needs — a direct request to
`/boards/1/tasks/2` has no matching file on the server, only `index.html`
does, and Angular's router takes over from there. Without the rewrite, a
hard refresh on a deep link or the `**` route would 404 before Angular ever ran.

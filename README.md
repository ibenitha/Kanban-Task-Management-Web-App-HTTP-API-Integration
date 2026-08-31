# Kanban Task Management

A simplified Kanban board app built to practice **Angular Router and Navigation**:
routes, `routerLink` navigation, active-link highlighting, programmatic navigation,
route/query parameters, lazy loading, child routes, and route guards.

Every file is commented at the point where something non-obvious happens, so it
can be read top-to-bottom and explained in a code review without extra context.

## Running it locally

```bash
npm install
npm start        # ng serve — open http://localhost:4200
npm test         # unit tests (Vitest)
npm run build    # production build, output in dist/kanban-task-management/browser
```

## How the app is organized

```
src/app/
├── app.ts / app.html / app.css        Root shell: header + router-outlet + a
│                                       loading bar driven by router navigation events
├── app.routes.ts                      Root route table
├── app.config.ts                      Router setup: input binding, param
│                                       inheritance, preloading
│
├── shared/
│   ├── header/                        Persistent nav bar (routerLink + routerLinkActive)
│   └── models/board.model.ts          Board / Column / Task interfaces
│
├── core/
│   ├── services/
│   │   ├── auth.ts                    Mock login state (signal-based)
│   │   └── board.ts                   Mock board data (signal-based, stands in for an API)
│   └── guards/
│       ├── auth-guard.ts              CanActivate — protects /settings
│       └── unsaved-changes-guard.ts   CanDeactivate — confirms before discarding edits
│
├── boards/                            Main boards list — /boards
│
├── board-detail/                      Lazy-loaded feature area — /boards/:boardId
│   ├── board-detail.routes.ts         Routes for this feature (loaded on demand)
│   ├── board-detail.ts                Shell: board header + nested <router-outlet>
│   ├── column-list/                   Default child — columns/tasks, filter & sort query params
│   └── task-detail/                   Child route — /boards/:boardId/tasks/:taskId
│
├── settings/                          Protected page — /settings
├── login/                             Mock login — /login
└── not-found/                         Wildcard '**' route — 404 page
```

## Where each routing concept lives

| Concept | File |
|---|---|
| Route definitions | [app.routes.ts](src/app/app.routes.ts), [board-detail.routes.ts](src/app/board-detail/board-detail.routes.ts) |
| `routerLink` navigation | [boards.html](src/app/boards/boards.html), [header.html](src/app/shared/header/header.html) |
| Active link highlighting | [header.html](src/app/shared/header/header.html) (`routerLinkActive`) |
| Programmatic navigation | [column-list.ts](src/app/board-detail/column-list/column-list.ts) (`router.navigate`), [login.ts](src/app/login/login.ts) (`router.navigateByUrl`) |
| Navigation events (start/end/cancel/error) | [app.ts](src/app/app.ts) |
| Route parameters (`:boardId`, `:taskId`) | [board-detail.ts](src/app/board-detail/board-detail.ts), [task-detail.ts](src/app/board-detail/task-detail/task-detail.ts) — bound straight to component inputs, see `withComponentInputBinding()` in [app.config.ts](src/app/app.config.ts) |
| Query parameters (`?filter=&sort=`) | [column-list.ts](src/app/board-detail/column-list/column-list.ts) |
| Lazy loading (`loadChildren`) | [app.routes.ts](src/app/app.routes.ts) — the whole `board-detail` feature is a separate bundle, only fetched the first time a board is opened |
| Child routes | [board-detail.routes.ts](src/app/board-detail/board-detail.routes.ts) |
| Route preloading | `withPreloading(PreloadAllModules)` in [app.config.ts](src/app/app.config.ts) |
| `CanActivate` guard | [auth-guard.ts](src/app/core/guards/auth-guard.ts) — protects `/settings`, redirects to `/login?returnUrl=...` |
| `CanDeactivate` guard | [unsaved-changes-guard.ts](src/app/core/guards/unsaved-changes-guard.ts) — used on the task edit form and the settings form |
| Redirect + wildcard route | `''` → `/boards`, `'**'` → [not-found](src/app/not-found/not-found.ts), both in [app.routes.ts](src/app/app.routes.ts) |
| Persistent shared layout | [app.html](src/app/app.html) renders `<app-header>` once, outside `<router-outlet>` |

## Trying out the guards

- Go to `/settings` directly without logging in — you're redirected to `/login`,
  then back to `/settings` after clicking **Log In** (via the `returnUrl` query param).
- Open any task, edit its description, then click **Back to board** (or navigate
  away) — a confirm dialog blocks the navigation until you decide.

## A note on two advanced patterns (discussed, not implemented)

- **Auxiliary (named) routes** — Angular can render a second component
  alongside the primary one via a named `<router-outlet name="...">` (e.g. a
  chat panel next to the main view). This app only ever needs one outlet per
  level, so it isn't used, but it's configured the same way as any other
  route — just add an `outlet: 'name'` property.
- **Route preloading** *is* implemented — see the table above.

## Deployment

`netlify.toml` and `vercel.json` are both included, each set up to build the
app and rewrite every path to `index.html`. That rewrite matters because this
is a client-side-routed SPA: a direct request to, say,
`/boards/website-redesign` has no matching file on the server — only
`index.html` does — and Angular's router takes over from there once it loads.
Without the rewrite, refreshing a deep link or hitting the `**` route would
404 before Angular ever ran.

To deploy:
1. Push this repository to GitHub.
2. Import it in Netlify or Vercel — both auto-detect the config files above.
3. After deploying, verify a deep link (e.g. `/boards/mobile-app`) loads
   correctly on a hard refresh, and that an unknown path shows the 404 page.

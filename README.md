# FlowBoard

FlowBoard is a Kanban task management web app built with Angular. You can create boards, add tasks,
move them through four columns (To Do, In Progress, Review, Completed), edit or delete them, and
search and filter your boards.

## Features

- Boards list with search, filter and sort, all kept in the URL
- Kanban board view, single-column view and a task editor
- Create and delete boards; add, edit and delete tasks (with confirmation before deleting)
- Data loaded and saved through a REST API with Angular `HttpClient`
- Loading indicators, friendly error messages and a Retry button when the API is unreachable
- App state managed with NgRx (actions, reducers, selectors, effects)
- Lazy-loaded boards feature, route guards and unsaved-changes protection
- Responsive layout and accessible markup (see below)

## Tech stack

- Angular 22, TypeScript
- NgRx (store, effects, devtools)
- RxJS
- json-server (local REST API) and angular-in-memory-web-api (production)
- Vitest for unit and integration tests
- Netlify for hosting

## Getting started

Requirements: Node.js 22.22+ or 24.15+ and npm.

```bash
npm install
```

Run the API and the app in **two terminals**:

```bash
# terminal 1: REST API on http://localhost:3000
npm run api

# terminal 2: app on http://localhost:4200
npm start
```

`npm run api` resets the data from `mock-api/seed.json` each time it starts.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the development server |
| `npm run api` | Start the json-server REST API |
| `npm test` | Run all tests once |
| `npm run build` | Production build into `dist/` |

## API

The app talks to a REST API through two data services:

| Request | Service method |
|---|---|
| `GET /boards` | `BoardService.getBoards()` |
| `POST /boards` | `BoardService.createBoard()` |
| `DELETE /boards/:id` | `BoardService.deleteBoard()` |
| `GET /tasks` | `TaskService.getTasks()` |
| `POST /tasks` | `TaskService.createTask()` |
| `PUT /tasks/:id` | `TaskService.updateTask()` |
| `DELETE /tasks/:id` | `TaskService.deleteTask()` |

The API URL comes from the environment files in `src/environments/`:

- **Development** (`environment.development.ts`): json-server at `http://localhost:3000`.
- **Production** (`environment.ts`): Netlify only hosts static files, so the app uses
  `angular-in-memory-web-api`, which answers the same requests inside the browser. Data on the
  live site resets when the page is refreshed.

Components never call the API directly. They dispatch NgRx actions, and effects call the services.
Data is loaded once per session and cached in the store.

## Project structure

```
src/
├── environments/          API URL per environment
└── app/
    ├── core/
    │   ├── api/           Endpoints, HTTP error handling, production mock backend
    │   ├── services/      BoardService, TaskService, auth, navigation, notifications
    │   ├── guards/        Auth and unsaved-changes guards
    │   └── models/        Board and Task interfaces
    ├── pages/             Login, settings, not-found
    └── features/boards/   Lazy-loaded boards feature
        ├── state/         NgRx actions, reducer, selectors, effects
        └── pages/         Board list, board details, overview, column, task, add task
mock-api/                  Seed data for the REST API
```

## Accessibility

- Semantic landmarks, one `h1` per page and a skip-to-content link
- Every form field has a label; validation errors are announced to screen readers
- Loading and error messages use `role="status"` / `role="alert"`
- Buttons have clear accessible names (e.g. "Delete board Website Redesign")
- Visible keyboard focus on all interactive elements
- Respects the reduced-motion setting; status is never shown by colour alone

## Responsive design

- Sidebar on desktop, top navigation bar on tablets and phones
- Board cards reflow from a grid to a single column on small screens
- Kanban columns scroll horizontally on narrow screens instead of shrinking
- Forms stack into one column on phones; tested at 375px with no horizontal scrolling

## Testing

```bash
npm test
```

21 test files and 113 tests: services (with `HttpTestingController`), NgRx reducer, selectors and
effects, components, guards, and routing integration tests. No server needs to be running.

## Deployment

The app is deployed on Netlify. `netlify.toml` sets the build command (`npm run build`), the
publish folder (`dist/kanban-task-management/browser`) and a redirect so that refreshing any page
works in this single-page app.

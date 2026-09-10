# Barberia Frontend

React 19 + Vite + TypeScript + Tailwind v4.

## Folder structure

The project is currently a fresh Vite scaffold. As it grows, organize `src/` following this structure:

```
frontend/
├── public/          # Static assets served as-is at the site root (favicons, robots.txt).
│                     Not processed by Vite — reference with an absolute path, e.g. /favicon.svg.
├── src/
│   ├── assets/       # Static assets imported by code (images, svgs, fonts). Vite fingerprints
│   │                 # and bundles these, unlike public/.
│   ├── components/   # Reusable, presentational UI components shared across pages/features.
│   │                 # One folder per component (Component.tsx + styles/tests) if it grows.
│   ├── pages/        # Top-level route components (one per screen/route).
│   ├── hooks/        # Reusable custom React hooks (use*.ts).
│   ├── services/     # API clients / HTTP calls to the backend, one module per domain area.
│   ├── context/       # React Context providers for cross-cutting app state (auth, theme, etc.).
│   ├── types/        # Shared TypeScript types and interfaces.
│   ├── utils/        # Small, framework-agnostic helper functions.
│   ├── router.tsx    # Route definitions — maps URL paths to page components.
│   ├── main.tsx      # App entry point, mounts React (via the router) to the DOM.
│   └── index.css     # Global styles / Tailwind entry point.
├── index.html        # Vite's HTML entry point.
├── vite.config.ts    # Vite build/dev server configuration.
├── tailwind.config.js
└── tsconfig*.json
```

Not every folder needs to exist from day one — create `pages/`, `hooks/`, `services/`, etc. as soon as there's a second thing that belongs in them, rather than up front.

## Setup

```
cd frontend
npm install
```

## Running the app

```
npm run dev       # starts the Vite dev server (default: http://localhost:5173), hot-reloads on save
npm run build     # type-checks (tsc -b) and builds a production bundle to dist/
npm run preview   # serves the production build locally
npm run lint       # runs eslint
npm run format     # runs prettier --write
```

The frontend talks to the backend API — see `../docs/architecture.md` and `../backend/` for how to get the backend (and its Postgres DB via `docker compose up -d`) running if you need real data.

## Adding a new page

1. Create the page component in `src/pages/`, e.g. `src/pages/BookingPage.tsx`:

   ```tsx
   function BookingPage() {
     return <h1>Booking</h1>;
   }

   export default BookingPage;
   ```

2. Register it as a route in `src/router.tsx`:

   ```tsx
   import BookingPage from './pages/BookingPage';

   const router = createBrowserRouter([
     { path: '/', element: <ExamplePage /> },
     { path: '/booking', element: <BookingPage /> },
   ]);
   ```

3. Run `npm run dev` and visit the new path in the browser to confirm it renders.

See `src/pages/ExamplePage.tsx` for a working reference — it's the route already wired up in `router.tsx`.

## Adding functionality to a page

Keep pages themselves thin (layout + composition) and push logic into the appropriate folder so it can be reused and tested independently:

- **API calls** → add a function in `src/services/` (one module per backend domain, e.g. `services/appointments.ts`) and call it from the page, rather than calling `fetch`/`axios` directly in the component.
- **Shared state / data fetching logic** → wrap it in a custom hook in `src/hooks/` (e.g. `useAppointments.ts`) if more than one page or component needs it.
- **Reusable UI** (buttons, forms, cards) → build it as a component in `src/components/` instead of inlining large JSX blocks in the page.
- **Cross-cutting state** (auth, current user, theme) → use a provider in `src/context/`, not prop-drilling through pages.
- **Shared TS types** → put them in `src/types/` so both a service and the page that consumes it can import the same shape.

Run `npm run lint` and `npm run build` before opening a PR — the build step also type-checks the whole project.

## Making an API request

Every service module goes through the shared `apiClient` in `src/services/apiClient.ts` instead of calling `fetch` directly — it's the only file that talks to `fetch`. It handles:

- Building the URL from `VITE_API_URL` + the path you pass in.
- The backend's response envelope, `{ data, message, error }` — on success it unwraps and returns `data` directly, so your service functions get back the plain payload, not the wrapper.
- Errors: a non-2xx status, a non-null `error` array in the body, or a network failure (backend unreachable) all throw an `ApiError` (extends `Error`) carrying `status` and `errors: string[]`, so callers can catch one error type instead of re-implementing status/shape checks per call.

`apiClient` exposes `get`, `post`, `put`, and `delete`, each generic over the expected response type:

```ts
// src/services/tests.ts — this example uses the backend's `test` scaffold endpoint
import { apiClient } from './apiClient';

export interface Test {
  id: number;
  nombre: string;
}

export function listarTests(): Promise<Test[]> {
  return apiClient.get<Test[]>('/listarTests');
}
```

Then call it from a page (or a custom hook in `src/hooks/` if more than one place needs the data):

```tsx
// src/pages/TestsPage.tsx
import { useEffect, useState } from 'react';
import { listarTests, type Test } from '../services/tests';
import { ApiError } from '../types/api';

function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarTests()
      .then(setTests)
      .catch((err: ApiError) => setError(err.message));
  }, []);

  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {tests.map((test) => (
        <li key={test.id}>{test.nombre}</li>
      ))}
    </ul>
  );
}

export default TestsPage;
```

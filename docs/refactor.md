# Refactor: From Spring Boot to Svelte 5 SPA

How this project was built from scratch as a Svelte 5 single-page
app backed by `localStorage`. The previous version (Spring Boot +
PostgreSQL + Flyway) lives in the parent `inventory-manager/`
repository and is intentionally not migrated; this is a fresh
start with a different scope.

## 1. Decisions locked

| # | Decision                                       | Why                                    |
| - | ---------------------------------------------- | -------------------------------------- |
| 1 | Drop `size` and `strength` from character      | Carry cap is user-entered              |
| 2 | Default inventory non-deletable                | Matches design doc rule                |
| 3 | Three normalized `localStorage` keys           | Cheap joins in-memory; no SQL          |
| 4 | Nested JSON export shape                       | One file is human-readable             |
| 5 | `crypto.randomUUID()` for IDs                  | Native, no deps                        |
| 6 | Svelte 5 with runes                            | Current default in 2026                |
| 7 | Yarn 4 with `nodeLinker: node-modules`         | Modern, but no PnP complexity          |
| 8 | `svelte-dnd-action` for drag/drop              | Tested library; don't re-implement     |
| 9 | Custom hash router for navigation              | Zero deps, Svelte 5 native, ~80 lines  |
| 10| No ToS / Privacy Policy pages                  | Out of scope by user request           |
| 11| No component tests; Vitest for storage + io    | Tests where the value is highest       |
| 12| VPS deploy via `node server.mjs`               | Zero-dep static SPA server             |

## 2. Project shape

```text
local-storage/
├── docs/                  (this file + agent docs)
├── public/                (static assets)
├── src/                   (Svelte app)
│   ├── main.js
│   ├── App.svelte
│   ├── app.css
│   ├── lib/
│   │   ├── storage.js     (localStorage CRUD)
│   │   ├── router.js
│   │   ├── utils.js
│   │   ├── io/            (import/export)
│   │   ├── stores/        (Svelte stores)
│   │   ├── components/    (12 atoms/molecules)
│   │   ├── forms/         (3 forms)
│   │   └── views/         (ListView, SheetView)
│   └── routes/
│       ├── list.js
│       └── sheet.js
├── tests/                 (Vitest setup)
├── server.mjs             (VPS static SPA server)
├── vite.config.js
├── svelte.config.js
├── jsconfig.json
├── package.json
└── README.md
```

No `build/`, no `src/` for backend code, no `compose.yaml`, no
`Dockerfile`, no `nginx.conf`. The frontend is the project.

## 3. Step-by-step (how to recreate this from zero)

### 3.1 Install toolchain
```bash
corepack enable
corepack prepare yarn@4.5.0 --activate
```

### 3.2 Create the project
```bash
mkdir inventory-manager-fork
cd inventory-manager-fork
```

### 3.3 Copy the files
This `local-storage/` folder is the project. Move it to wherever
the new repo will live.

### 3.4 Install dependencies
```bash
yarn install
```

### 3.5 Run in dev
```bash
yarn dev
# open http://localhost:5173
```

### 3.6 Run tests
```bash
yarn test
```

### 3.7 Build for production
```bash
yarn build
# dist/ is ready to ship
```

### 3.8 Serve locally
```bash
yarn start
# open http://localhost:3000
```

### 3.9 Deploy to a VPS
```bash
# on the VPS
git clone <your-fork-url>
cd inventory-manager-fork
corepack enable
yarn install --immutable
yarn build
PORT=3000 node server.mjs
```

Put a reverse proxy (nginx or Caddy) in front to add TLS. The
server itself is a plain Node `http` server on `0.0.0.0:3000`.

## 4. What got deleted from the previous version

- `src/main/java/...` — entire Spring Boot backend
- `build.gradle`, `settings.gradle`, `gradle/`, `gradlew*`
- `Dockerfile`, `compose.yaml`, `nginx/`
- `scripts/` (Flyway helper)
- `docs/sec-tasks.md` (8 epics; not relevant to a localStorage SPA)
- Backend tests (95 tests, 0 failures, 0 skipped) — replaced by
  Vitest suite for `storage.js` and `io/*` only

## 5. What got kept

- `docs/designDoc1.md` (in the parent repo) — historical reference
  for the original Spring Boot scope. Not copied here.
- The minimalist visual language (off-white, single indigo accent,
  system fonts, dark mode via `prefers-color-scheme`).
- The DnD UX (drag inventories to reorder, drag items between or
  within inventories) — now via `svelte-dnd-action`.
- Form drafts (refresh mid-edit, draft restored).
- Toast and confirm dialog patterns.

## 6. What got simplified

- No character `size` / `strength` fields (user enters `maxWeight`
  directly per character and per inventory).
- No `<dialog>` API gymnastics — Svelte's component model is enough
  for modal UIs.
- No manual hash-routing — `svelte-spa-router` handles it.
- No manual state diff for drag — `svelte-dnd-action` does it.

## 7. Definition of done

- `yarn install` succeeds.
- `yarn test` passes.
- `yarn build` produces `dist/`.
- `yarn start` serves the build on port 3000.
- Manual smoke checklist (in `docs/instructions.md`) is fully checked.
- `docs/agent.md`, `docs/skills.md`, `docs/instructions.md` are
  up to date.
- No files left over from the previous Spring Boot version.

# Inventory Manager — Svelte 5 + localStorage

A D&D 5e 2024 inventory manager that runs entirely in the browser.
No backend, no accounts, no analytics. Your data stays in your
browser's `localStorage`.

## Features

- Characters, inventories, items — full CRUD
- One default inventory ("Equipado") per character
- Drag-and-drop items within and between inventories
- Drag-and-drop to reorder inventories
- Per-inventory and per-character capacity (`maxWeight`), or unlimited
- JSON import / export (full collection or one character)
- Light / dark mode (follows system)
- Keyboard shortcuts
- Form drafts survive a refresh
- Zero runtime dependencies (only build-time tools)

## Stack

- **Svelte 5** (runes API)
- **Vite 5** (build, dev server)
- **Yarn 4** (Berry) with `nodeLinker: node-modules`
- **Custom hash router** (no deps, ~80 lines)
- **`svelte-dnd-action`** (drag-and-drop)
- **Vitest** + **happy-dom** (tests for `storage.js` and `io/*`)
- **No backend** (data lives in `localStorage`)

## Quick start

```bash
corepack enable
corepack prepare yarn@4.5.0 --activate
yarn install
yarn dev
```

Open <http://localhost:5173>.

## Scripts

| Command        | What it does                          |
| -------------- | ------------------------------------- |
| `yarn dev`     | Vite dev server with HMR              |
| `yarn build`   | Build `dist/`                         |
| `yarn preview` | Serve the build with Vite preview     |
| `yarn test`    | Run Vitest once                       |
| `yarn test:watch` | Vitest watch mode                  |
| `yarn start`   | Serve `dist/` on `:3000` via `server.mjs` |

## Deploy to a VPS

The whole app is a static SPA. Build it and serve the result.

```bash
yarn install --immutable
yarn build
PORT=3000 node server.mjs
```

`server.mjs` is a zero-dependency Node static server with SPA
fallback. Put nginx or Caddy in front to add TLS.

For production, run with `pm2`, `systemd`, or Docker.

## Data: where it lives, how to move it

All data is in your browser's `localStorage` under three keys:

- `inv:v1:characters`
- `inv:v1:inventories`
- `inv:v1:items`

This means:
- Clearing browser data wipes everything.
- Data does not sync between devices automatically.
- Each browser/profile has its own copy.

Use the **Exportar tudo** button on the list page to download a
JSON file. Use **Importar** to load one on a different device or
browser.

## Project structure

```
src/
├── main.js                  (mounts <App />)
├── App.svelte               (Router + Toast)
├── app.css                  (design tokens, dark mode)
└── lib/
    ├── storage.js           (localStorage CRUD)
    ├── storage.test.js
    ├── router.js
    ├── utils.js
    ├── io/
    │   ├── export.js        (build + download JSON)
    │   ├── export.test.js
    │   ├── import.js        (parse + apply JSON)
    │   └── import.test.js
    ├── stores/              (Svelte writable stores)
    ├── components/          (Header, Toast, Dialog, Field, etc.)
    ├── forms/               (CharacterForm, InventoryForm, ItemForm)
    └── views/               (ListView, SheetView, NotFound)
```

## Documentation

- `docs/design.md` — full design doc
- `docs/refactor.md` — how this project came to be
- `docs/agent.md` — entry point for AI agents
- `docs/skills.md` — patterns to follow in this codebase
- `docs/instructions.md` — workflow, build, deploy, DoD

## License

Add your own license here. MIT is a sensible default for a personal
project. If you accept donations, link to your platform of choice
in a `FUNDING` file.

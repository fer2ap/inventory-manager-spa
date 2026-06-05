# instructions.md

How to work in this project. Read this when you need to run,
build, test, deploy, or change code.

## 1. Prerequisites

- **Node.js 20+** (LTS recommended)
- **Corepack** enabled (`corepack enable` once per machine)
- **Git**

That's it. No global `yarn` install needed; Corepack provides the
correct Yarn 4 version.

## 2. First-time setup

```bash
corepack enable
corepack prepare yarn@4.5.0 --activate
yarn install
```

## 3. Common commands

| Command        | What it does                                  |
| -------------- | --------------------------------------------- |
| `yarn dev`     | Start Vite dev server (HMR) on :5173          |
| `yarn build`   | Build `dist/` for production                  |
| `yarn preview` | Serve the built `dist/` via Vite preview      |
| `yarn test`    | Run Vitest once (CI mode)                     |
| `yarn test:watch` | Run Vitest in watch mode                   |
| `yarn start`   | Serve the built `dist/` via `server.mjs` on :3000 |

## 4. Project layout (where to put new code)

- New atomic UI piece → `src/lib/components/`
- New form → `src/lib/forms/`
- New page-level view → `src/lib/views/`
- New route entry → `src/routes/`
- New `localStorage` operation → method on `storage.js` (don't
  read/write the keys from anywhere else)
- New JSON shape or import/export rule → `src/lib/io/`
- New global Svelte store → `src/lib/stores/`
- New test → `*.test.js` next to the file it tests
- Doc update → `docs/`

## 5. Code style

- **JavaScript, not TypeScript.** Use JSDoc for hints where it
  helps the editor (`/** @type {string} */`).
- **2-space indent.** Trailing newline at EOF.
- **Svelte 5 runes everywhere.** No `let` reactivity, no `$:`.
- **Component files** are named in PascalCase
  (`CharacterCard.svelte`). **JS modules** are kebab-case
  (`storage.js`, `build-export.js`, `routes.js`).
- **Don't reach for `svelte-spa-router`.** We removed it
  because it uses Svelte 4 lifecycle hooks (`afterUpdate`)
  forbidden in runes mode. The custom router in
  `src/lib/router.js` covers the use case.
- **One component per file.** One default export.
- **No `console.log` left in committed code.** Errors only.
- **No comments in code** unless the user asks. The doc files
  carry the "why".

## 6. Adding a new feature (workflow)

1. Read `docs/design.md` to confirm the feature fits scope.
2. If the feature needs a new `localStorage` shape, add a method
   to `src/lib/storage.js` and a test in `storage.test.js`.
3. If the feature needs new JSON I/O, add to `io/export.js` and
   `io/import.js` with tests in the matching `*.test.js`.
4. Build the UI in components → forms → views. Keep components
   small (<200 lines).
5. Add or update CSS in `app.css` (tokens) and the component's
   scoped `<style>` (layout).
6. Run `yarn test` and `yarn build`.
7. Run the manual smoke checklist (§10 below) for any affected
   area.
8. Commit. Use Conventional Commits (`feat:`, `fix:`, `docs:`,
   `refactor:`, `test:`, `chore:`).

## 7. Adding a dependency

- Runtime deps: add to `dependencies` in `package.json` and
  explain why in the commit message.
- Dev deps (build, test, format): add to `devDependencies`.
- Prefer libraries with zero transitive deps. Avoid UI frameworks
  (we don't need them).

## 8. Deploying to a VPS

```bash
# on the VPS, as a non-root user with Node 20+:
git clone <your-fork-url> inventory-manager-fork
cd inventory-manager-fork
corepack enable
yarn install --immutable
yarn build
```

Then run the server. Three common options:

**a) Foreground (for testing):**
```bash
PORT=3000 node server.mjs
```

**b) pm2 (recommended for production):**
```bash
yarn global add pm2
pm2 start server.mjs --name inventory --time
pm2 save
pm2 startup    # follow the printed instructions
```

**c) systemd unit** — see `deploy/inventory.service.example`
(write this file when you set up the VPS; not included in the
scaffold because host paths differ).

Put a reverse proxy in front for TLS:
- **nginx**: typical config proxies `:443` to `127.0.0.1:3000`
  and serves ACME challenges from `/var/www/letsencrypt`.
- **Caddy**: `inventory.example.com { reverse_proxy 127.0.0.1:3000 }`
  — auto-TLS, one file.

### Data persistence on the VPS

`localStorage` is per-browser, per-origin. The VPS itself stores
nothing. If users want to move data between devices, they use
**Export** (downloads a JSON file) and **Import** (uploads one).
Make sure this is mentioned in the README and the UI.

## 9. Build artifacts

- `dist/` — the production build. Contains `index.html`, JS, CSS,
  and copied `public/` assets. Safe to delete and regenerate.
- `node_modules/` — local deps. Safe to delete and reinstall.
- `yarn.lock` — committed; never hand-edit.
- `.yarn/cache`, `.yarn/install-state.gz` — Yarn 4 cache; safe to
  delete (regenerated on next `yarn install`).

## 10. Manual smoke checklist

Run these in a browser before tagging a release. The full list
lives in `docs/refactor.md`; the highlights:

- [ ] Create character → default "Equipado" inventory appears
- [ ] Add second inventory; reorder by drag
- [ ] Add item; move item between inventories by drag
- [ ] Try to delete default inventory → blocked
- [ ] Try to delete non-empty non-default inventory → blocked
- [ ] Edit character, edit inventory, edit item — drafts survive
      a refresh
- [ ] Delete character → cascade removes its inventories and items
- [ ] Reload page → data persists
- [ ] Export all → JSON file downloads; opens as text
- [ ] Import → merge and replace both work
- [ ] Mobile viewport: list and sheet are usable
- [ ] Keyboard: `n`, `/`, `?`, `Esc`

## 11. Definition of done

A change is "done" when:

1. `yarn test` passes with no skipped tests.
2. `yarn build` succeeds with no warnings about missing imports.
3. The relevant items in §10 are checked.
4. Any new public function in `storage.js` or `io/*` has at least
   one test.
5. The commit message follows Conventional Commits.
6. The docs are still accurate (if a public surface changed,
   `docs/design.md` and `docs/agent.md` are updated).

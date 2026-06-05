# agent.md

Entry point for any AI agent (or new human contributor) working on
this project. Read this file first.

## Read these in order

1. **`docs/design.md`** — the source of truth. Stack, data model,
   business rules, file structure, storage layer surface.
2. **`docs/instructions.md`** — workflow, build/test commands,
   deploy procedure, code style, definition of done.
3. **`docs/skills.md`** — Svelte 5 / Vite / Yarn 4 / localStorage
   patterns an agent should follow.
4. **`docs/refactor.md`** — how this project came to be; useful
   for understanding the "why" behind the shape.

## Tech at a glance

- **Svelte 5** with the runes API. Every component uses
  `$state`, `$derived`, `$effect`, `$props`. No legacy `let`
  reactivity.
- **Vite 5** for dev and build. `yarn dev` for HMR; `yarn build`
  for `dist/`.
- **Yarn 4** with `nodeLinker: node-modules`. `corepack enable`
  first, then `yarn install`.
- **`localStorage`** as the only persistence. Three versioned
  keys (`inv:v1:characters`, `inv:v1:inventories`, `inv:v1:items`).
  All reads/writes go through `src/lib/storage.js`.
- **No backend.** No auth, no ToS, no analytics.

## What to touch vs what to leave alone

- **Touch freely**: components, forms, views, stores,
  `storage.js` (add methods), `io/*` (add cases), CSS in
  `app.css` and scoped `<style>` blocks, docs.
- **Touch carefully**: the three localStorage keys (changing
  the shape requires a `:v2:` migration), `server.mjs` (keep
  zero-dep), `package.json` deps (minimize).
- **Do not touch**: `node_modules/`, `dist/`, `yarn.lock` (only
  on `yarn install`).

## What "done" means here

See `docs/instructions.md` § "Definition of done". Short version:
`yarn test` passes, `yarn build` succeeds, the manual smoke
checklist is fully checked, and any new public storage or IO
function has a test.

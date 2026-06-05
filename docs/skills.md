# skills.md

Reusable patterns an agent should follow when working in this
codebase. Read this when you need to write or modify code and
want to match existing conventions.

## 1. Svelte 5 runes

Every component uses runes. Never use the legacy `let foo = ...`
reactivity.

```svelte
<script>
  // props from parent
  let { character, onSave } = $props();

  // local state
  let editing = $state(false);
  let draft = $state("");

  // derived
  let isValid = $derived(draft.trim().length > 0);

  // side effects
  $effect(() => {
    console.log("character changed:", character.id);
  });
</script>
```

Patterns to prefer:
- `$state(...)` for primitives, `$state([])` or `$state({})` for
  collections.
- `$derived(expr)` for computed values; do not compute inside
  templates unless trivial.
- `$effect(() => { ... })` for side effects; always include the
  full dependency in the body or it will warn.
- `onclick={handler}` (lowercase, Svelte 5) not `on:click`.
- `{@html escaped}` is fine because we pre-escape with `escapeHtml`.

Patterns to avoid:
- `let` with `$:` (legacy reactivity).
- Two-way binding with `bind:` on deeply nested objects; use
  callbacks instead.
- Big components (>200 lines). Split.

## 2. Vite config quirks

- `base: "./"` in `vite.config.js` makes the build relocatable
  (works under a GitHub Pages project page, a custom domain, or
  a VPS subpath).
- `server.strictPort: false` lets Vite bump to 5174 if 5173 is
  taken.
- Tests use `happy-dom` (faster than jsdom) and pick up files
  matching `src/**/*.test.js`.

## 3. Yarn 4

- `nodeLinker: node-modules` in `.yarnrc.yml` is the only config
  needed. Do not enable PnP — it breaks too many tools.
- `corepack enable` once, then `corepack prepare yarn@4.5.0
  --activate` to pin the version. Users can then `yarn install`
  without a global install.
- Use `yarn install` (not `npm install` or `pnpm install`).
- `yarn dlx <tool>` instead of `npx <tool>`.

## 4. localStorage patterns

- **Only `storage.js` reads/writes.** No other file should call
  `localStorage.getItem`/`setItem`. If you find yourself reaching
  for it, add a method to `storage.js`.
- **Keys are versioned**: `inv:v1:characters`, etc. If the shape
  changes, add a `:v2:` key and migrate on read.
- **Strings only.** `JSON.stringify` on write, `JSON.parse` on
  read; `Array.isArray(parsed)` before trusting the result.
- **No transactions.** If two tabs write at once, the last write
  wins. We don't try to detect or merge.
- **~5–10 MB per origin.** Plenty for D&D sheets; if a user ever
  hits it, JSON.stringify the lot and try-catch on `setItem`.
- **Defensive reads:** if the key is missing or the value isn't
  valid JSON, return `[]` (or `null` for singletons) and log a
  warning. Never throw on a corrupt read; the user would lose
  access to the whole app.

## 5. Custom hash router

- Routes are declared in `src/lib/routes.js` as a flat array
  `{ pattern, component, userData }`. The router itself lives in
  `src/lib/router.js` (~80 lines, no deps, Svelte 5 native).
- `push(path)` and `navigate(path)` navigate programmatically.
- The `link` action is used on `<a href="#/characters/{id}">` to
  intercept clicks and use `push()` instead of a full page load.
- Components receive `params` (for `:id` segments) and `userData`
  as props from the router.
- The router uses the Svelte 5 `mount()` / `unmount()` API in a
  tiny wrapper that re-renders the matched component on every
  `hashchange`. It is not a full library — if you need features
  like nested routes, history-API mode, or route guards, swap
  it out (one file to change).

## 6. svelte-dnd-action

- `<div use:dndzone={{ items, flipDurationMs: 200 }} on:consider
  on:finalize>` wraps a list. Each child needs a `key` (Svelte
  5: `animate:flip` on each child for animations).
- On `consider`, update a local copy of the list; on `finalize`,
  commit via the storage layer.
- For drag-between-zones (item move), set `type` on each zone
  with the same string and use `dropFromOthersDisabled: true`
  on inventories that should not receive items.

## 7. Tests

- Test files live next to the code: `storage.js` → `storage.test.js`.
- Vitest globals are on (`describe`, `it`, `expect`, `beforeEach`).
- The setup file (`tests/setup.js`) installs `crypto.randomUUID`
  in `happy-dom` and clears `localStorage` between tests.
- One test file per module, not per function. Group by behaviour
  with nested `describe` blocks.
- Prefer `expect(...).toEqual(...)` (deep) over `toBe` (reference)
  for object/array assertions.

## 8. Accessibility

- Every interactive element is a real `<button>` or `<a>`, not a
  `<div>` with `onclick`.
- All form fields have a `<label for="...">`.
- Dialogs trap focus; closing returns focus to the trigger.
- Skip link as the first focusable element (`#main` anchor).
- `aria-live="polite"` on the toast container.

## 9. CSS

- CSS variables in `app.css` for the design tokens. Don't hardcode
  colors or spacing in components.
- Svelte's scoped `<style>` for component styles. Use `:global(...)`
  sparingly (only for things like `body` resets).
- Dark mode via `@media (prefers-color-scheme: dark)` only — no
  toggle.
- Honor `prefers-reduced-motion` for animations.

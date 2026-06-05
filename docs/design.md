# Design Document — Inventory Manager Fork

A D&D 5e 2024 inventory manager that runs entirely in the browser.
No backend, no accounts, no analytics. Data lives in `localStorage`.

## 1. Goal

Help D&D players manage their characters' inventories: track items
across multiple containers (backpack, pouches, equipped gear), see
how full each container is, and warn when the character is over
their user-defined carry cap.

The system intentionally does not enforce D&D rules. It shows
weight, capacity, and percentage used; the player decides what to do
when they are over.

## 2. Stack

| Concern    | Choice                                        |
| ---------- | --------------------------------------------- |
| Framework  | Svelte 5 (runes API)                          |
| Build      | Vite 5                                        |
| Package mgr| Yarn 4 (Berry), `nodeLinker: node-modules`    |
| Routing    | Custom hash router (~80 lines, no deps)       |
| Drag/drop  | `svelte-dnd-action`                           |
| Persistence| `localStorage` (3 normalized keys)            |
| Tests      | Vitest + happy-dom (storage + io only)        |
| Deploy     | `dist/` served by `server.mjs` on a VPS       |

No UI library. No CSS framework. Hand-rolled CSS in `app.css` plus
Svelte's scoped `<style>` blocks. Theme: minimalist contemporary
(off-white background, single indigo accent `#5e5ce6`, system fonts,
`prefers-color-scheme` dark mode).

## 3. Scope

### In scope

- CRUD for characters, inventories, items
- One default inventory ("Equipado") created automatically per character
- Drag-and-drop reordering of inventories and items
- Drag-and-drop moving items between inventories
- Per-inventory `maxWeight` (user-entered, or `null` for unlimited)
- Per-character `maxWeight` (user-entered; the character's carry cap)
- JSON import / export of all or individual characters
- Form drafts (refresh mid-edit, draft restored)
- Toast feedback and confirm dialogs
- Keyboard shortcuts (`n`, `/`, `?`, `Esc`)
- Light/dark mode via system preference

### Out of scope

- Authentication, multi-user, sharing
- Backend, server-side rendering
- Cloud sync, cloud backup
- ToS / Privacy Policy pages
- Component tests (only `storage.js` and `io/*` have tests)
- Analytics, cookies, telemetry
- D&D 5e rule enforcement (encumbrance is informational only)

## 4. Architecture

```text
Browser
  ├── index.html
  ├── css (app.css)
  └── JS
      ├── Svelte 5 components (views, forms, atoms)
      ├── stores/      (Svelte writable stores)
      ├── lib/storage  (localStorage CRUD)
      ├── lib/io/      (JSON import/export)
      └── lib/router   (svelte-spa-router config)
```

There is no server-side state. The app reads from and writes to
`localStorage` directly. Three keys, one per entity.

## 5. Data model

```text
Character
  id          UUID
  name        string
  maxWeight   number | null   (carry cap; null = unlimited)
  createdAt   number          (Date.now())

Inventory
  id            UUID
  characterId   UUID
  name          string
  description   string | null
  maxWeight     number | null
  isDefault     boolean
  displayOrder  number
  createdAt     number

Item
  id          UUID
  inventoryId UUID
  name        string
  description string | null
  quantity    integer (>= 0)
  unitWeight  number  (>= 0)
  createdAt   number
```

`size` and `strength` are intentionally absent. The carry cap is
whatever the user types in.

## 6. localStorage layout

```text
inv:v1:characters  →  [Character, ...]
inv:v1:inventories →  [Inventory, ...]
inv:v1:items       →  [Item, ...]
```

The `:v1:` segment is the schema version. If a future migration
changes the shape, code reads with a fallback and writes under
`:v2:`. Never delete the old version on read — copy on migrate.

## 7. Business rules

- **Character**: `name` non-empty. `maxWeight` is a non-negative
  number, or `null` for unlimited.
- **Default inventory**: created on character creation with
  `{name: "Equipado", isDefault: true, maxWeight: null,
  displayOrder: 10}`. Cannot be deleted. `maxWeight` is always
  `null` (unlimited) for the default inventory.
- **Non-default inventory**: `maxWeight` is a non-negative number
  or `null` (unlimited). Deletable only when empty.
- **Item**: `name` non-empty, `quantity >= 0`, `unitWeight >= 0`.
- **Reorder**: `displayOrder` values are `10, 20, 30, ...` for
  changed positions; default inventory is excluded from reorder and
  always rendered first.
- **Cascade delete**: deleting a character removes its inventories
  and items.
- **Over cap**: allowed. The UI shows the percentage and color-codes
  it (green/yellow/orange/red). The system does not block.

## 8. Calculations

```text
itemWeight        = quantity * unitWeight
inventoryWeight   = Σ(itemWeight for item in inventory)
characterWeight   = Σ(inventoryWeight for inventory in character)
inventoryOccupied = inventoryWeight / maxWeight    (maxWeight > 0)
```

If `maxWeight` is `null` or `0`, the occupancy is "Unlimited" and no
bar is drawn.

## 9. File structure

```text
local-storage/
├── docs/           (design, refactor, agent, skills, instructions)
├── public/         (static assets)
├── src/
│   ├── main.js
│   ├── App.svelte
│   ├── app.css
│   ├── lib/
│   │   ├── storage.js
│   │   ├── storage.test.js
│   │   ├── router.js
│   │   ├── utils.js
│   │   ├── io/
│   │   │   ├── export.js
│   │   │   ├── export.test.js
│   │   │   ├── import.js
│   │   │   └── import.test.js
│   │   ├── stores/
│   │   │   ├── characters.js
│   │   │   ├── toast.js
│   │   │   └── dialog.js
│   │   ├── components/   (12 Svelte components)
│   │   ├── forms/        (3 Svelte components)
│   │   └── views/        (ListView, SheetView)
│   └── routes/
│       ├── list.js
│       └── sheet.js
├── tests/          (Vitest setup)
├── server.mjs      (VPS static SPA server)
├── vite.config.js
├── svelte.config.js
├── jsconfig.json
├── package.json
└── README.md
```

## 10. Storage layer

`src/lib/storage.js` is the only module that reads or writes
`localStorage`. Views and forms call it; nothing else touches the
keys directly. Public surface:

```js
// Characters
listCharacters():               Character[]
getCharacter(id):               Character | null
createCharacter({ name, maxWeight }): Character
updateCharacter(id, patch):     Character
deleteCharacter(id):            void  // cascade

// Inventories
listInventories(characterId):   Inventory[]
getInventory(id):               Inventory | null
createInventory(characterId, { name, maxWeight }): Inventory
updateInventory(id, patch):     Inventory
deleteInventory(id):            void  // throws if isDefault or has items
reorderInventories(characterId, idList): void

// Items
listItems(inventoryId):         Item[]
getItem(id):                    Item | null
createItem(inventoryId, patch): Item
updateItem(id, patch):          Item
deleteItem(id):                 void
moveItem(itemId, targetInventoryId): Item

// Convenience
getSheet(characterId):          { character, inventories, items }
```

## 11. Import / export

`src/lib/io/export.js` and `src/lib/io/import.js`.

Export shape (one JSON file per export):

```jsonc
{
  "version": 1,
  "app": "inventory-manager-fork",
  "exportedAt": "2026-06-04T12:34:56.789Z",
  "characters": [
    {
      "id": "uuid", "name": "Aragorn", "maxWeight": 120, "createdAt": 1717000000000,
      "inventories": [
        {
          "id": "uuid", "name": "Equipado", "description": null, "maxWeight": null,
          "isDefault": true, "displayOrder": 10, "createdAt": 1717000000000,
          "items": [
            { "id": "uuid", "name": "Espada", "description": null,
              "quantity": 1, "unitWeight": 3, "createdAt": 1717000000000 }
          ]
        }
      ]
    }
  ]
}
```

- `buildExport(characterIds = null)` returns the object; with `null`,
  exports all.
- `downloadJson(data, filename)` triggers a browser download.
- `parseExport(string)` validates shape and version, throws on
  bad data with a helpful message.
- `importAll(data, { mode })` where mode is `"merge"` or `"replace"`.
- `importCharacter(character)` imports a single character (with new
  IDs to avoid collisions).

## 12. UI sketch

```text
+--------------------------------------------------+
|  Inventário D&D                  [+ Novo]  [?]  |  <- Header
+--------------------------------------------------+
|  Lista de personagens                            |
|                                                  |
|  +-------------------------------------------+   |
|  | Aragorn          120 kg                  |   |  <- CharacterCard
|  | Criado em 04/06/2026                     |   |
|  +-------------------------------------------+   |
|                                                  |
|  +-------------------------------------------+   |
|  | Legolas           90 kg                  |   |
|  +-------------------------------------------+   |
|                                                  |
|  [Exportar tudo]   [Importar]                    |
+--------------------------------------------------+
```

Sheet view:

```text
+--------------------------------------------------+
|  < Voltar    Aragorn    [Exportar]  [Excluir]    |
+--------------------------------------------------+
|  Capacidade máxima: 120 kg                       |
|  Carga atual: 45.3 kg (38%)                      |
|                                                  |
|  +-------------+  +-------------+               |
|  | Equipado    |  | Mochila     |  <- InventoryCard
|  | (padrão)    |  | 30 kg / 40  |               |
|  | 5.5 kg      |  | ▓▓▓░░ 75%   |               |
|  | • Espada    |  | • Potion    |               |
|  | • Arco      |  | • Corda     |               |
|  +-------------+  +-------------+               |
+--------------------------------------------------+
```

Color ramp: 0–49% green, 50–79% yellow, 80–99% orange, 100%+ red.
Background gradient on the inventory card's capacity bar.

## 13. Non-functional goals

- **Simple**: no backend, no auth, no build step at runtime.
  `git clone && yarn install && yarn dev` should be enough to start.
- **Fast**: 95+ Lighthouse score on a static deploy.
- **Small**: total runtime JS well under 200 KB gzipped.
- **Portable**: same code runs on GitHub Pages, Cloudflare Pages,
  Netlify, or `node server.mjs` on a VPS.
- **Resilient to data loss**: any user can export their full
  collection to a JSON file and import it on a new device.

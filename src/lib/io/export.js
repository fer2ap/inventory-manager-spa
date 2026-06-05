// src/lib/io/export.js
// Build and download JSON exports of the local data.

import * as storage from "../storage.js";
import { downloadFile } from "../utils.js";

const APP = "inventory-manager-fork";
const VERSION = 1;

/**
 * Build an export object.
 * @param {string[] | null} characterIds  null = all characters.
 */
export function buildExport(characterIds = null) {
  const characters = storage.listCharacters();
  const selected = characterIds
    ? characters.filter((c) => characterIds.includes(c.id))
    : characters;

  const out = {
    version: VERSION,
    app: APP,
    exportedAt: new Date().toISOString(),
    characters: selected.map((c) => {
      const { inventories, items } = storage.getSheet(c.id);
      return {
        id: c.id,
        name: c.name,
        maxWeight: c.maxWeight,
        createdAt: c.createdAt,
        inventories: inventories.map((inv) => ({
          id: inv.id,
          name: inv.name,
          description: inv.description,
          maxWeight: inv.maxWeight,
          isDefault: inv.isDefault,
          displayOrder: inv.displayOrder,
          createdAt: inv.createdAt,
          items: items
            .filter((it) => it.inventoryId === inv.id)
            .map((it) => ({
              id: it.id,
              name: it.name,
              description: it.description,
              quantity: it.quantity,
              unitWeight: it.unitWeight,
              createdAt: it.createdAt,
            })),
        })),
      };
    }),
  };
  return out;
}

/**
 * Trigger a browser download of the given data as JSON.
 */
export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  downloadFile(blob, filename);
}

/**
 * Convenience: build + download a full export.
 */
export function exportAll(filename = null) {
  const data = buildExport();
  const name = filename || `inventory-${stamp()}.json`;
  downloadJson(data, name);
  return data;
}

/**
 * Convenience: build + download one character.
 */
export function exportCharacter(characterId, customName = null) {
  const data = buildExport([characterId]);
  const safeName = customName
    || (data.characters[0]?.name || "personagem")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-|-$/g, "")
    || "personagem";
  const name = `inventory-${safeName}-${stamp()}.json`;
  downloadJson(data, name);
  return data;
}

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

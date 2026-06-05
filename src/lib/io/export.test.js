// src/lib/io/export.test.js
import { describe, it, expect } from "vitest";
import * as storage from "../storage.js";
import { buildExport, exportAll, exportCharacter } from "./export.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function seed() {
  const c = storage.createCharacter({ name: "Aragorn", maxWeight: 120 });
  const inv = storage.createInventory(c.id, { name: "Mochila", maxWeight: 20 });
  storage.createItem(inv.id, { name: "Espada", quantity: 1, unitWeight: 3 });
  return c;
}

describe("buildExport", () => {
  it("returns the documented shape with version 1", () => {
    const c = seed();
    const out = buildExport();
    expect(out.version).toBe(1);
    expect(out.app).toBe("inventory-manager-fork");
    expect(typeof out.exportedAt).toBe("string");
    expect(out.characters).toHaveLength(1);
    expect(out.characters[0].name).toBe("Aragorn");
    expect(out.characters[0].inventories).toHaveLength(2); // default + mochila
    const moch = out.characters[0].inventories.find((i) => i.name === "Mochila");
    expect(moch.items).toHaveLength(1);
    expect(moch.items[0].name).toBe("Espada");
  });

  it("exports a subset when given character ids", () => {
    const a = seed();
    const b = storage.createCharacter({ name: "Legolas", maxWeight: 90 });
    const out = buildExport([a.id]);
    expect(out.characters).toHaveLength(1);
    expect(out.characters[0].id).toBe(a.id);
    expect(out.characters[0].name).toBe("Aragorn");
  });

  it("returns an empty characters array when there is no data", () => {
    const out = buildExport();
    expect(out.characters).toEqual([]);
  });
});

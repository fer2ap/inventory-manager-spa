// src/lib/io/import.test.js
import { describe, it, expect } from "vitest";
import * as storage from "../storage.js";
import { parseExport, importAll, importCharacter } from "./import.js";

function validExport() {
  return {
    version: 1,
    app: "inventory-manager-fork",
    exportedAt: new Date().toISOString(),
    characters: [
      {
        id: "c1",
        name: "Aragorn",
        maxWeight: 120,
        createdAt: 1717000000000,
        inventories: [
          {
            id: "i1",
            name: "Equipado",
            description: null,
            maxWeight: null,
            isDefault: true,
            displayOrder: 10,
            createdAt: 1717000000000,
            items: [
              { id: "t1", name: "Espada", description: null, quantity: 1, unitWeight: 3, createdAt: 1717000000000 },
            ],
          },
          {
            id: "i2",
            name: "Mochila",
            description: null,
            maxWeight: 20,
            isDefault: false,
            displayOrder: 20,
            createdAt: 1717000000000,
            items: [],
          },
        ],
      },
    ],
  };
}

describe("parseExport", () => {
  it("parses a valid export", () => {
    const data = parseExport(JSON.stringify(validExport()));
    expect(data.version).toBe(1);
    expect(data.characters).toHaveLength(1);
  });

  it("rejects bad JSON", () => {
    expect(() => parseExport("not json")).toThrow(/JSON válido/);
  });

  it("rejects unknown version", () => {
    const data = validExport();
    data.version = 99;
    expect(() => parseExport(JSON.stringify(data))).toThrow(/Versão 99/);
  });

  it("rejects when characters is not an array", () => {
    const data = { version: 1, characters: "x" };
    expect(() => parseExport(JSON.stringify(data))).toThrow(/lista/);
  });

  it("rejects when an inventory is missing items array", () => {
    const data = validExport();
    delete data.characters[0].inventories[0].items;
    expect(() => parseExport(JSON.stringify(data))).toThrow(/items/);
  });

  it("rejects when an item is missing name", () => {
    const data = validExport();
    data.characters[0].inventories[0].items[0].name = "";
    expect(() => parseExport(JSON.stringify(data))).toThrow(/sem id ou nome/);
  });
});

describe("importAll", () => {
  it("merge mode: adds characters without touching existing", () => {
    storage.createCharacter({ name: "Existing", maxWeight: 10 });
    const data = validExport();
    const result = importAll(data, { mode: "merge" });
    expect(result.added).toBe(1);
    expect(storage.listCharacters()).toHaveLength(2);
  });

  it("merge mode: skips duplicate ids", () => {
    const data = validExport();
    importAll(data, { mode: "merge" });
    const result = importAll(data, { mode: "merge" });
    expect(result.added).toBe(0);
  });

  it("replace mode: removes unrelated characters", () => {
    const e = storage.createCharacter({ name: "Existing", maxWeight: 10 });
    const data = validExport();
    importAll(data, { mode: "replace" });
    const list = storage.listCharacters();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Aragorn");
    expect(storage.getCharacter(e.id)).toBeNull();
  });
});

describe("importCharacter", () => {
  it("imports a single character with reassigned ids", () => {
    const data = validExport();
    const newId = importCharacter(data.characters[0]);
    expect(newId).not.toBe("c1");
    const sheet = storage.getSheet(newId);
    expect(sheet.character.name).toBe("Aragorn");
    expect(sheet.inventories).toHaveLength(2);
    expect(sheet.items).toHaveLength(1);
    // ids on the imported record should be different
    expect(sheet.inventories[0].id).not.toBe("i1");
  });
});

// src/lib/storage.test.js
import { describe, it, expect } from "vitest";
import * as storage from "./storage.js";

const C = (name, max) => storage.createCharacter({ name, maxWeight: max });
const I = (charId, name, max = null) => storage.createInventory(charId, { name, maxWeight: max });
const IT = (invId, name, qty = 1, w = 0) => storage.createItem(invId, { name, quantity: qty, unitWeight: w });

describe("storage: characters", () => {
  it("creates a character and a default inventory", () => {
    const c = C("Aragorn", 120);
    expect(c.id).toMatch(/^00000000-0000-4000-8000-/);
    expect(c.name).toBe("Aragorn");
    expect(c.maxWeight).toBe(120);
    const invs = storage.listInventories(c.id);
    expect(invs).toHaveLength(1);
    expect(invs[0].isDefault).toBe(true);
    expect(invs[0].maxWeight).toBeNull();
    expect(invs[0].name).toBe("Equipado");
  });

  it("rejects an empty name", () => {
    expect(() => C("   ", 10)).toThrow(/obrigat/);
  });

  it("rejects negative maxWeight", () => {
    expect(() => C("X", -1)).toThrow(/>= 0/);
  });

  it("updates a character", () => {
    const c = C("X", 10);
    const u = storage.updateCharacter(c.id, { name: "Y", maxWeight: 20 });
    expect(u.name).toBe("Y");
    expect(u.maxWeight).toBe(20);
  });

  it("throws on missing character", () => {
    expect(() => storage.updateCharacter("nope", { name: "x" })).toThrow(/não encontrado/);
    expect(() => storage.deleteCharacter("nope")).toThrow(/não encontrado/);
  });

  it("cascade-deletes default inventory and items", () => {
    const c = C("X", 10);
    const def = storage.listInventories(c.id)[0];
    IT(def.id, "Espada", 1, 3);
    storage.deleteCharacter(c.id);
    expect(storage.getCharacter(c.id)).toBeNull();
    expect(storage.listInventories(c.id)).toHaveLength(0);
    expect(storage.listItems(def.id)).toHaveLength(0);
  });

  it("blocks deleting a character that has non-default inventories", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    expect(() => storage.deleteCharacter(c.id)).toThrow(/inventário/);
    expect(storage.getCharacter(c.id)).not.toBeNull();
    expect(storage.getInventory(inv.id)).not.toBeNull();
  });

  it("blocks deleting a character that has an empty non-default inventory", () => {
    const c = C("X", 10);
    I(c.id, "Bolsa", 5);
    expect(() => storage.deleteCharacter(c.id)).toThrow(/inventário/);
    expect(storage.getCharacter(c.id)).not.toBeNull();
  });

  it("counts all non-default inventories in the error message", () => {
    const c = C("X", 10);
    I(c.id, "Mochila", 20);
    I(c.id, "Bolsa", 5);
    expect(() => storage.deleteCharacter(c.id)).toThrow(/2 inventário/);
  });
});

describe("storage: inventories", () => {
  it("creates non-default inventories with sequential displayOrder", () => {
    const c = C("X", 10);
    const a = I(c.id, "Mochila", 20);
    const b = I(c.id, "Bolsa", 5);
    expect(a.displayOrder).toBe(20);
    expect(b.displayOrder).toBe(30);
  });

  it("rejects maxWeight on default inventory", () => {
    const c = C("X", 10);
    const def = storage.listInventories(c.id)[0];
    expect(() => storage.updateInventory(def.id, { maxWeight: 10 })).toThrow(/padrão/);
  });

  it("blocks deleting the default inventory", () => {
    const c = C("X", 10);
    const def = storage.listInventories(c.id)[0];
    expect(() => storage.deleteInventory(def.id)).toThrow(/padrão/);
  });

  it("blocks deleting a non-empty inventory", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    IT(inv.id, "Potion", 1, 0.5);
    expect(() => storage.deleteInventory(inv.id)).toThrow(/vazio/);
  });

  it("deletes an empty non-default inventory", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    storage.deleteInventory(inv.id);
    expect(storage.getInventory(inv.id)).toBeNull();
  });

  it("reorder: assigns displayOrder in given order, default can be anywhere", () => {
    const c = C("X", 10);
    const def = storage.listInventories(c.id)[0];
    const a = I(c.id, "A");
    const b = I(c.id, "B");
    const cc = I(c.id, "C");
    storage.reorderInventories(c.id, [cc.id, def.id, a.id, b.id]);
    const after = storage.listInventories(c.id);
    expect(after.map((i) => i.id)).toEqual([cc.id, def.id, a.id, b.id]);
    expect(after[0].displayOrder).toBe(10);
    expect(after[1].displayOrder).toBe(20);
    expect(after[2].displayOrder).toBe(30);
    expect(after[3].displayOrder).toBe(40);
  });

  it("reorder: rejects wrong number of ids", () => {
    const c = C("X", 10);
    const def = storage.listInventories(c.id)[0];
    const a = I(c.id, "A");
    expect(() => storage.reorderInventories(c.id, [def.id])).toThrow(/inválida/);
  });

  it("reorder: rejects ids that don't belong to the character", () => {
    const c1 = C("X", 10);
    const c2 = C("Y", 10);
    const def1 = storage.listInventories(c1.id)[0];
    const a = I(c1.id, "A");
    const def2 = storage.listInventories(c2.id)[0];
    expect(() => storage.reorderInventories(c1.id, [def1.id, def2.id])).toThrow(/não pertence/);
  });

  it("reorder: allows the default inventory to be placed anywhere", () => {
    const c = C("X", 10);
    const def = storage.listInventories(c.id)[0];
    const a = I(c.id, "A");
    expect(() => storage.reorderInventories(c.id, [a.id, def.id])).not.toThrow();
    const after = storage.listInventories(c.id);
    expect(after[0].id).toBe(a.id);
    expect(after[1].id).toBe(def.id);
  });
});

describe("storage: items", () => {
  it("creates and updates an item", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    const it = IT(inv.id, "Espada", 1, 3);
    expect(it.quantity).toBe(1);
    expect(it.unitWeight).toBe(3);
    const u = storage.updateItem(it.id, { quantity: 2 });
    expect(u.quantity).toBe(2);
  });

  it("rejects negative quantity and weight", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    expect(() => IT(inv.id, "X", -1, 1)).toThrow(/inteiro/);
    expect(() => IT(inv.id, "Y", 1, -1)).toThrow(/>= 0/);
  });

  it("moves an item between inventories", () => {
    const c = C("X", 10);
    const a = I(c.id, "A", 20);
    const b = I(c.id, "B", 20);
    const it = IT(a.id, "Espada", 1, 3);
    storage.moveItem(it.id, b.id);
    expect(storage.getItem(it.id).inventoryId).toBe(b.id);
    expect(storage.listItems(a.id)).toHaveLength(0);
    expect(storage.listItems(b.id)).toHaveLength(1);
  });

  it("deletes an item", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    const it = IT(inv.id, "Espada", 1, 3);
    storage.deleteItem(it.id);
    expect(storage.getItem(it.id)).toBeNull();
  });

  it("createItem assigns sequential order per inventory", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    const a = IT(inv.id, "A");
    const b = IT(inv.id, "B");
    const cc = IT(inv.id, "C");
    expect(a.order).toBe(10);
    expect(b.order).toBe(20);
    expect(cc.order).toBe(30);
  });

  it("listItems sorts by order, not by name", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    const zebra = IT(inv.id, "Zebra");
    const apple = IT(inv.id, "Apple");
    const mango = IT(inv.id, "Mango");
    // Creation order: Zebra, Apple, Mango
    expect(storage.listItems(inv.id).map((i) => i.name)).toEqual(["Zebra", "Apple", "Mango"]);
    storage.reorderItems(inv.id, [mango.id, apple.id, zebra.id]);
    expect(storage.listItems(inv.id).map((i) => i.name)).toEqual(["Mango", "Apple", "Zebra"]);
  });

  it("reorderItems sets order based on position", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    const a = IT(inv.id, "A");
    const b = IT(inv.id, "B");
    const cc = IT(inv.id, "C");
    storage.reorderItems(inv.id, [cc.id, a.id, b.id]);
    const items = storage.listItems(inv.id);
    expect(items.map((i) => i.id)).toEqual([cc.id, a.id, b.id]);
    expect(items[0].order).toBe(10);
    expect(items[1].order).toBe(20);
    expect(items[2].order).toBe(30);
  });

  it("reorderItems: rejects wrong size", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    IT(inv.id, "A");
    IT(inv.id, "B");
    expect(() => storage.reorderItems(inv.id, [storage.listItems(inv.id)[0].id])).toThrow(/inválida/);
  });

  it("reorderItems: rejects ids that don't belong to the inventory", () => {
    const c = C("X", 10);
    const inv = I(c.id, "Mochila", 20);
    const other = I(c.id, "Bolsa", 5);
    const a = IT(inv.id, "A");
    const b = IT(other.id, "B");
    expect(() => storage.reorderItems(inv.id, [a.id, b.id])).toThrow(/pertence/);
  });

  it("moveItem assigns a fresh order in the target inventory", () => {
    const c = C("X", 10);
    const a = I(c.id, "A", 20);
    const b = I(c.id, "B", 20);
    const x = IT(b.id, "X");
    const y = IT(b.id, "Y");
    const moved = IT(a.id, "M");
    const maxInB = Math.max(x.order, y.order);
    storage.moveItem(moved.id, b.id);
    const after = storage.getItem(moved.id);
    expect(after.inventoryId).toBe(b.id);
    expect(after.order).toBe(maxInB + 10);
  });

  it("cross-zone move + reorder: inserted at given position", () => {
    const c = C("X", 10);
    const a = I(c.id, "A", 20);
    const b = I(c.id, "B", 20);
    const x = IT(b.id, "X");
    const y = IT(b.id, "Y");
    const z = IT(b.id, "Z");
    const moved = IT(a.id, "M");
    storage.moveItem(moved.id, b.id);
    storage.reorderItems(b.id, [x.id, moved.id, y.id, z.id]);
    expect(storage.listItems(b.id).map((i) => i.name)).toEqual(["X", "M", "Y", "Z"]);
    expect(storage.listItems(a.id)).toHaveLength(0);
  });

  it("moveItemOrder: swaps with neighbor up/down", () => {
    const c = C("X", 10);
    const inv = I(c.id, "A", 20);
    const a = IT(inv.id, "A");
    const b = IT(inv.id, "B");
    const c2 = IT(inv.id, "C");
    storage.moveItemOrder(b.id, "up");
    expect(storage.listItems(inv.id).map((i) => i.name)).toEqual(["B", "A", "C"]);
    storage.moveItemOrder(b.id, "down");
    expect(storage.listItems(inv.id).map((i) => i.name)).toEqual(["A", "B", "C"]);
  });

  it("moveItemOrder: noop at boundaries", () => {
    const c = C("X", 10);
    const inv = I(c.id, "A", 20);
    const a = IT(inv.id, "A");
    const b = IT(inv.id, "B");
    storage.moveItemOrder(a.id, "up");
    expect(storage.listItems(inv.id).map((i) => i.name)).toEqual(["A", "B"]);
    storage.moveItemOrder(b.id, "down");
    expect(storage.listItems(inv.id).map((i) => i.name)).toEqual(["A", "B"]);
  });
});

describe("storage: getSheet", () => {
  it("assembles character + inventories + items", () => {
    const c = C("Aragorn", 120);
    const inv = I(c.id, "Mochila", 20);
    const it = IT(inv.id, "Espada", 1, 3);
    const sheet = storage.getSheet(c.id);
    expect(sheet.character.id).toBe(c.id);
    expect(sheet.inventories).toHaveLength(2); // default + mochila
    expect(sheet.items).toHaveLength(1);
    expect(sheet.items[0].id).toBe(it.id);
  });

  it("returns items sorted by order, grouped by inventory", () => {
    const c = C("Aragorn", 120);
    const def = storage.listInventories(c.id)[0];
    const inv = I(c.id, "Mochila", 20);
    const a = IT(inv.id, "Zebra");
    const b = IT(inv.id, "Apple");
    const c2 = IT(inv.id, "Mango");
    storage.reorderItems(inv.id, [c2.id, b.id, a.id]);
    const sheet = storage.getSheet(c.id);
    const invOrder = sheet.items
      .filter((i) => i.inventoryId === inv.id)
      .map((i) => i.name);
    expect(invOrder).toEqual(["Mango", "Apple", "Zebra"]);
  });
});

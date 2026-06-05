// src/lib/storage.js
// The ONLY module that reads or writes localStorage.
// All public functions are pure-ish: they read state, mutate, persist, return.

// ---------- keys ----------
const KEY_CHARACTERS  = "inv:v1:characters";
const KEY_INVENTORIES = "inv:v1:inventories";
const KEY_ITEMS       = "inv:v1:items";

// ---------- helpers ----------
const uuid = () =>
  (globalThis.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);

const now = () => Date.now();

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`[storage] corrupt read on ${key}; returning []`, err);
    return [];
  }
}

function writeArray(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (err) {
    console.error(`[storage] write failed on ${key}`, err);
    throw new Error("Não foi possível salvar: armazenamento cheio ou indisponível.");
  }
}

function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} é obrigatório.`);
  }
  return value.trim();
}

function assertNonNegativeNumber(value, field) {
  if (value == null) return null;
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new Error(`${field} deve ser um número >= 0.`);
  }
  return value;
}

function assertNonNegativeInt(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} deve ser um inteiro >= 0.`);
  }
  return value;
}

function notFound(id) {
  const err = new Error(`Recurso ${id} não encontrado.`);
  err.code = "NOT_FOUND";
  return err;
}

// ---------- Characters ----------

export function listCharacters() {
  return readArray(KEY_CHARACTERS)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function getCharacter(id) {
  return readArray(KEY_CHARACTERS).find((c) => c.id === id) || null;
}

export function createCharacter({ name, maxWeight = null }) {
  const cleanName = assertNonEmptyString(name, "Nome");
  const cleanMax  = assertNonNegativeNumber(maxWeight, "Capacidade máxima");
  const characters = readArray(KEY_CHARACTERS);
  const character = {
    id: uuid(),
    name: cleanName,
    maxWeight: cleanMax,
    createdAt: now(),
  };
  characters.push(character);
  writeArray(KEY_CHARACTERS, characters);
  createInventory(character.id, { name: "Equipado", maxWeight: null, isDefault: true });
  return character;
}

export function updateCharacter(id, { name, maxWeight }) {
  const characters = readArray(KEY_CHARACTERS);
  const idx = characters.findIndex((c) => c.id === id);
  if (idx === -1) throw notFound(id);
  const patch = {};
  if (name !== undefined)     patch.name = assertNonEmptyString(name, "Nome");
  if (maxWeight !== undefined) patch.maxWeight = assertNonNegativeNumber(maxWeight, "Capacidade máxima");
  const updated = { ...characters[idx], ...patch };
  characters[idx] = updated;
  writeArray(KEY_CHARACTERS, characters);
  return updated;
}

export function deleteCharacter(id) {
  const characters = readArray(KEY_CHARACTERS);
  const character = characters.find((c) => c.id === id);
  if (!character) throw notFound(id);

  const inventories = readArray(KEY_INVENTORIES).filter((i) => i.characterId === id);
  const nonDefault = inventories.filter((i) => !i.isDefault);
  if (nonDefault.length > 0) {
    throw new Error(
      `Exclua os ${nonDefault.length} inventário(s) não padrão antes de remover o personagem.`
    );
  }

  const inventoryIds = new Set(inventories.map((i) => i.id));
  const items = readArray(KEY_ITEMS).filter((i) => !inventoryIds.has(i.inventoryId));

  writeArray(KEY_INVENTORIES, readArray(KEY_INVENTORIES).filter((i) => i.characterId !== id));
  writeArray(KEY_ITEMS, items);
  writeArray(KEY_CHARACTERS, characters.filter((c) => c.id !== id));
}

// ---------- Inventories ----------

export function listInventories(characterId) {
  return readArray(KEY_INVENTORIES)
    .filter((i) => i.characterId === characterId)
    .sort(inventoryOrder);
}

// Default inventory sorts only by displayOrder like any other.
function inventoryOrder(a, b) {
  if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
  return a.name.localeCompare(b.name, "pt-BR");
}

export function getInventory(id) {
  return readArray(KEY_INVENTORIES).find((i) => i.id === id) || null;
}

export function createInventory(characterId, { name, maxWeight = null, description = null, isDefault = false }, _internal = false) {
  if (!_internal) {
    const character = getCharacter(characterId);
    if (!character) throw notFound(characterId);
  }
  const cleanName = assertNonEmptyString(name, "Nome");
  const cleanDesc = description == null ? null : String(description);
  const cleanMax  = isDefault ? null : assertNonNegativeNumber(maxWeight, "Capacidade máxima");
  const inventories = readArray(KEY_INVENTORIES);
  const maxOrder = inventories
    .filter((i) => i.characterId === characterId)
    .reduce((m, i) => Math.max(m, i.displayOrder || 0), 0);
  const inventory = {
    id: uuid(),
    characterId,
    name: cleanName,
    description: cleanDesc,
    maxWeight: cleanMax,
    isDefault,
    displayOrder: isDefault ? 10 : maxOrder + 10,
    createdAt: now(),
  };
  inventories.push(inventory);
  writeArray(KEY_INVENTORIES, inventories);
  return inventory;
}

export function updateInventory(id, { name, description, maxWeight, displayOrder }) {
  const inventories = readArray(KEY_INVENTORIES);
  const idx = inventories.findIndex((i) => i.id === id);
  if (idx === -1) throw notFound(id);
  const inv = inventories[idx];
  if (inv.isDefault && maxWeight !== undefined && maxWeight !== null) {
    throw new Error("O inventário padrão não pode ter capacidade limitada.");
  }
  const patch = {};
  if (name !== undefined)        patch.name = assertNonEmptyString(name, "Nome");
  if (description !== undefined) patch.description = description == null ? null : String(description);
  if (maxWeight !== undefined) {
    patch.maxWeight = inv.isDefault ? null : assertNonNegativeNumber(maxWeight, "Capacidade máxima");
  }
  if (displayOrder !== undefined) {
    if (!Number.isInteger(displayOrder)) {
      throw new Error("displayOrder deve ser um inteiro.");
    }
    patch.displayOrder = displayOrder;
  }
  const updated = { ...inv, ...patch };
  inventories[idx] = updated;
  writeArray(KEY_INVENTORIES, inventories);
  return updated;
}

export function deleteInventory(id) {
  const inventories = readArray(KEY_INVENTORIES);
  const inv = inventories.find((i) => i.id === id);
  if (!inv) throw notFound(id);
  if (inv.isDefault) throw new Error("O inventário padrão não pode ser excluído.");
  const hasItems = readArray(KEY_ITEMS).some((i) => i.inventoryId === id);
  if (hasItems) throw new Error("O inventário precisa estar vazio para ser excluído.");
  writeArray(KEY_INVENTORIES, inventories.filter((i) => i.id !== id));
}

export function reorderInventories(characterId, idList) {
  const inventories = readArray(KEY_INVENTORIES).filter((i) => i.characterId === characterId);
  if (inventories.length === 0) return;

  const ids = new Set(inventories.map((i) => i.id));
  if (idList.length !== inventories.length) {
    throw new Error("Lista de inventários inválida (tamanho).");
  }
  if (new Set(idList).size !== idList.length) {
    throw new Error("Lista de inventários inválida (ids repetidos).");
  }
  for (const id of idList) {
    if (!ids.has(id)) throw new Error(`Inventário ${id} não pertence ao personagem.`);
  }

  let step = 10;
  const all = readArray(KEY_INVENTORIES);
  let changed = false;
  for (let i = 0; i < idList.length; i++) {
    const idx = all.findIndex((inv) => inv.id === idList[i]);
    if (idx === -1) continue;
    const desired = (i + 1) * step;
    if (all[idx].displayOrder !== desired) {
      all[idx] = { ...all[idx], displayOrder: desired };
      changed = true;
    }
  }
  if (changed) writeArray(KEY_INVENTORIES, all);
}

// ---------- Items ----------

export function listItems(inventoryId) {
  return readArray(KEY_ITEMS)
    .filter((i) => i.inventoryId === inventoryId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getItem(id) {
  return readArray(KEY_ITEMS).find((i) => i.id === id) || null;
}

export function createItem(inventoryId, { name, description = null, quantity = 1, unitWeight = 0 }) {
  const inv = getInventory(inventoryId);
  if (!inv) throw notFound(inventoryId);
  const cleanName = assertNonEmptyString(name, "Nome");
  const cleanDesc = description == null ? null : String(description);
  const cleanQty  = assertNonNegativeInt(Number(quantity) || 0, "Quantidade");
  const cleanW    = assertNonNegativeNumber(Number(unitWeight) || 0, "Peso unitário");
  const item = {
    id: uuid(),
    inventoryId,
    name: cleanName,
    description: cleanDesc,
    quantity: cleanQty,
    unitWeight: cleanW,
    order: (readArray(KEY_ITEMS)
      .filter((i) => i.inventoryId === inventoryId)
      .reduce((m, i) => Math.max(m, i.order || 0), 0)) + 10,
    createdAt: now(),
  };
  const items = readArray(KEY_ITEMS);
  items.push(item);
  writeArray(KEY_ITEMS, items);
  return item;
}

export function updateItem(id, { name, description, quantity, unitWeight }) {
  const items = readArray(KEY_ITEMS);
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw notFound(id);
  const patch = {};
  if (name !== undefined)        patch.name = assertNonEmptyString(name, "Nome");
  if (description !== undefined) patch.description = description == null ? null : String(description);
  if (quantity !== undefined)   patch.quantity = assertNonNegativeInt(Number(quantity) || 0, "Quantidade");
  if (unitWeight !== undefined) patch.unitWeight = assertNonNegativeNumber(Number(unitWeight) || 0, "Peso unitário");
  const updated = { ...items[idx], ...patch };
  items[idx] = updated;
  writeArray(KEY_ITEMS, items);
  return updated;
}

export function deleteItem(id) {
  const items = readArray(KEY_ITEMS);
  if (!items.some((i) => i.id === id)) throw notFound(id);
  writeArray(KEY_ITEMS, items.filter((i) => i.id !== id));
}

export function moveItem(itemId, targetInventoryId) {
  const items = readArray(KEY_ITEMS);
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) throw notFound(itemId);
  const target = getInventory(targetInventoryId);
  if (!target) throw notFound(targetInventoryId);
  if (items[idx].inventoryId === targetInventoryId) return items[idx];
  const maxOrder = items
    .filter((i) => i.inventoryId === targetInventoryId)
    .reduce((m, i) => Math.max(m, i.order || 0), 0);
  const updated = { ...items[idx], inventoryId: targetInventoryId, order: maxOrder + 10 };
  items[idx] = updated;
  writeArray(KEY_ITEMS, items);
  return updated;
}

export function moveItemOrder(itemId, direction) {
  const items = readArray(KEY_ITEMS);
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) throw notFound(itemId);
  const item = items[idx];
  const siblings = items
    .filter((i) => i.inventoryId === item.inventoryId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const pos = siblings.findIndex((i) => i.id === itemId);
  if (pos === -1) throw notFound(itemId);
  const swapWith = direction === "up" ? pos - 1 : pos + 1;
  if (swapWith < 0 || swapWith >= siblings.length) return item;
  const a = siblings[pos];
  const b = siblings[swapWith];
  const aOrder = a.order || 0;
  const bOrder = b.order || 0;
  const updated = items.map((it) => {
    if (it.id === a.id) return { ...it, order: bOrder };
    if (it.id === b.id) return { ...it, order: aOrder };
    return it;
  });
  writeArray(KEY_ITEMS, updated);
  return { ...item, order: bOrder };
}

export function reorderItems(inventoryId, idList) {
  if (idList.length === 0) return;
  const items = readArray(KEY_ITEMS);
  const inThis = items.filter((i) => i.inventoryId === inventoryId);
  if (inThis.length === 0) return;
  const ids = new Set(inThis.map((i) => i.id));
  if (idList.length !== inThis.length) {
    throw new Error("Lista de itens inválida (tamanho).");
  }
  if (new Set(idList).size !== idList.length) {
    throw new Error("Lista de itens inválida (ids repetidos).");
  }
  for (const id of idList) {
    if (!ids.has(id)) throw new Error(`Item ${id} não pertence ao inventário.`);
  }
  let step = 10;
  const updated = [...items];
  let changed = false;
  for (let i = 0; i < idList.length; i++) {
    const idx = updated.findIndex((it) => it.id === idList[i]);
    if (idx === -1) continue;
    const desired = (i + 1) * step;
    if ((updated[idx].order || 0) !== desired) {
      updated[idx] = { ...updated[idx], order: desired };
      changed = true;
    }
  }
  if (changed) writeArray(KEY_ITEMS, updated);
}

// ---------- Convenience ----------

export function getSheet(characterId) {
  const character = getCharacter(characterId);
  if (!character) throw notFound(characterId);
  const inventories = listInventories(characterId);
  const inventoryIds = new Set(inventories.map((i) => i.id));
  const allItems = readArray(KEY_ITEMS).filter((i) => inventoryIds.has(i.inventoryId));
  const items = [];
  for (const inv of inventories) {
    const invItems = allItems
      .filter((i) => i.inventoryId === inv.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    items.push(...invItems);
  }
  return { character, inventories, items };
}

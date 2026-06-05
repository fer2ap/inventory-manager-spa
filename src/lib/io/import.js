// src/lib/io/import.js
// Parse JSON exports and apply them to the local store.

import * as storage from "../storage.js";

const SUPPORTED_VERSIONS = [1];

/**
 * Read a File via the FileReader API and return its text.
 */
export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsText(file);
  });
}

/**
 * Parse a JSON string and validate the export shape.
 * Throws on bad input with a helpful message.
 */
export function parseExport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Arquivo não é um JSON válido.");
  }
  validateShape(data);
  return data;
}

function validateShape(data) {
  if (data == null || typeof data !== "object") {
    throw new Error("Formato inválido: esperado um objeto na raiz.");
  }
  if (!SUPPORTED_VERSIONS.includes(data.version)) {
    throw new Error(
      `Versão ${data.version} não suportada. Aceito: ${SUPPORTED_VERSIONS.join(", ")}.`
    );
  }
  if (data.app && data.app !== "inventory-manager-fork") {
    console.warn(`[import] app field = ${data.app}; esperado inventory-manager-fork.`);
  }
  if (!Array.isArray(data.characters)) {
    throw new Error("Formato inválido: 'characters' deve ser uma lista.");
  }
  data.characters.forEach((c, i) => {
    if (!c.id || !c.name) {
      throw new Error(`Personagem #${i + 1} sem id ou nome.`);
    }
    if (!Array.isArray(c.inventories)) {
      throw new Error(`Personagem "${c.name}": 'inventories' deve ser uma lista.`);
    }
    c.inventories.forEach((inv, j) => {
      if (!inv.id || !inv.name) {
        throw new Error(`Personagem "${c.name}", inventário #${j + 1} sem id ou nome.`);
      }
      if (!Array.isArray(inv.items)) {
        throw new Error(`Personagem "${c.name}", inventário "${inv.name}": 'items' deve ser uma lista.`);
      }
      inv.items.forEach((it, k) => {
        if (!it.id || !it.name) {
          throw new Error(`Personagem "${c.name}", inventário "${inv.name}", item #${k + 1} sem id ou nome.`);
        }
      });
    });
  });
}

/**
 * Import all characters from an export.
 * @param {object} data            output of parseExport
 * @param {"merge"|"replace"} mode
 */
export function importAll(data, { mode = "merge" } = {}) {
  if (mode === "replace") {
    const ids = new Set(data.characters.map((c) => c.id));
    clearExcept(ids);
  }
  let added = 0;
  for (const c of data.characters) {
    if (exists(c.id) && mode === "merge") continue; // skip duplicates on merge
    addCharacter(c);
    added++;
  }
  return { added, mode };
}

/**
 * Import a single character. Returns the new id.
 * Reassigns all ids so the import does not collide with existing data.
 */
export function importCharacter(characterJson) {
  return addCharacter(characterJson, { reassignIds: true });
}

function clearExcept(skipIds) {
  const characters = JSON.parse(localStorage.getItem("inv:v1:characters") || "[]");
  const inventories = JSON.parse(localStorage.getItem("inv:v1:inventories") || "[]");
  const items = JSON.parse(localStorage.getItem("inv:v1:items") || "[]");
  const keepChars = characters.filter((c) => skipIds.has(c.id));
  const keepInvIds = new Set(inventories.filter((i) => keepChars.some((c) => c.id === i.characterId)).map((i) => i.id));
  const keepInv = inventories.filter((i) => keepInvIds.has(i.id));
  const keepItems = items.filter((i) => keepInvIds.has(i.inventoryId));
  localStorage.setItem("inv:v1:characters", JSON.stringify(keepChars));
  localStorage.setItem("inv:v1:inventories", JSON.stringify(keepInv));
  localStorage.setItem("inv:v1:items", JSON.stringify(keepItems));
}

function exists(id) {
  const characters = JSON.parse(localStorage.getItem("inv:v1:characters") || "[]");
  return characters.some((c) => c.id === id);
}

function addCharacter(c, { reassignIds = false } = {}) {
  const newCharId = reassignIds ? newId() : c.id;
  const characters = JSON.parse(localStorage.getItem("inv:v1:characters") || "[]");
  characters.push({
    id: newCharId,
    name: String(c.name),
    maxWeight: c.maxWeight == null ? null : Number(c.maxWeight),
    createdAt: c.createdAt || Date.now(),
  });
  localStorage.setItem("inv:v1:characters", JSON.stringify(characters));

  const inventories = JSON.parse(localStorage.getItem("inv:v1:inventories") || "[]");
  const items = JSON.parse(localStorage.getItem("inv:v1:items") || "[]");

  for (const inv of c.inventories) {
    const newInvId = reassignIds ? newId() : inv.id;
    inventories.push({
      id: newInvId,
      characterId: newCharId,
      name: String(inv.name),
      description: inv.description == null ? null : String(inv.description),
      maxWeight: inv.maxWeight == null ? null : Number(inv.maxWeight),
      isDefault: !!inv.isDefault,
      displayOrder: Number(inv.displayOrder) || 10,
      createdAt: inv.createdAt || Date.now(),
    });
    for (const it of inv.items || []) {
      const newItemId = reassignIds ? newId() : it.id;
      items.push({
        id: newItemId,
        inventoryId: newInvId,
        name: String(it.name),
        description: it.description == null ? null : String(it.description),
        quantity: Number(it.quantity) || 0,
        unitWeight: Number(it.unitWeight) || 0,
        createdAt: it.createdAt || Date.now(),
      });
    }
  }
  localStorage.setItem("inv:v1:inventories", JSON.stringify(inventories));
  localStorage.setItem("inv:v1:items", JSON.stringify(items));
  return newCharId;
}

function newId() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

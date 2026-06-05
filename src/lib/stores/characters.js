// src/lib/stores/characters.js
// Svelte writable store for the in-memory list of characters.
// The store is hydrated from localStorage on first read and refreshed
// by calling refresh() after any storage mutation.

import { writable } from "svelte/store";
import * as storage from "../storage.js";

function createCharactersStore() {
  const { subscribe, set } = writable([]);

  function refresh() {
    set(storage.listCharacters());
  }

  return {
    subscribe,
    refresh,
  };
}

export const characters = createCharactersStore();

// src/lib/stores/toast.js
// Tiny global toast queue. Newest at the bottom; each auto-dismisses.

import { writable } from "svelte/store";

const TOAST_TTL = 3500;

function createToastStore() {
  const { subscribe, update } = writable([]);
  let nextId = 1;

  function push(message, { type = "info", ttl = TOAST_TTL } = {}) {
    const id = nextId++;
    update((arr) => [...arr, { id, message, type }]);
    if (ttl > 0) {
      setTimeout(() => dismiss(id), ttl);
    }
    return id;
  }

  function dismiss(id) {
    update((arr) => arr.filter((t) => t.id !== id));
  }

  return { subscribe, push, dismiss };
}

export const toast = createToastStore();

// Convenience helpers
export const toastInfo  = (m) => toast.push(m, { type: "info" });
export const toastOk    = (m) => toast.push(m, { type: "ok" });
export const toastWarn  = (m) => toast.push(m, { type: "warn" });
export const toastError = (m) => toast.push(m, { type: "error" });

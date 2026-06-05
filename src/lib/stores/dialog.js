// src/lib/stores/dialog.js
// Global dialog queue. There is usually one dialog at a time,
// but the store is a queue to be safe.

import { writable } from "svelte/store";

let nextId = 1;

function createDialogStore() {
  const { subscribe, update, set } = writable({ queue: [] });

  function open({ title, message, confirmLabel = "OK", cancelLabel = "Cancelar", variant = "info", showCancel = false }) {
    return new Promise((resolve) => {
      const id = nextId++;
      const dialog = { id, title, message, confirmLabel, cancelLabel, variant, showCancel, resolve };
      update((state) => ({ queue: [...state.queue, dialog] }));
    });
  }

  function close(id, value) {
    update((state) => {
      const dialog = state.queue.find((d) => d.id === id);
      if (dialog) dialog.resolve(value);
      return { queue: state.queue.filter((d) => d.id !== id) };
    });
  }

  return { subscribe, open, close, set };
}

export const dialog = createDialogStore();

export const confirmDialog = (message, opts = {}) =>
  dialog.open({ title: opts.title || "Confirmação", message, showCancel: true, variant: "confirm", ...opts });

export const alertDialog = (message, opts = {}) =>
  dialog.open({ title: opts.title || "Aviso", message, showCancel: false, variant: "info", ...opts });

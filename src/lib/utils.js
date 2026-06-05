// src/lib/utils.js
// Small helpers shared across components. Keep this file lean.

// Format a weight in kg with up to 2 decimals.
export function formatKg(n) {
  if (n == null || Number.isNaN(n)) return "—";
  const fixed = Number(n).toFixed(2);
  // strip trailing zeros: 5.00 -> 5, 5.50 -> 5.5
  return fixed.replace(/\.?0+$/, "");
}

export function formatPct(p) {
  if (p == null || Number.isNaN(p)) return "—";
  return `${Math.round(p * 100)}%`;
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDate(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}

export function formatDateTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function itemWeight(item) {
  if (!item) return 0;
  return (Number(item.quantity) || 0) * (Number(item.unitWeight) || 0);
}

export function inventoryWeight(inventory, items) {
  return items
    .filter((i) => i.inventoryId === inventory.id)
    .reduce((sum, i) => sum + itemWeight(i), 0);
}

export function characterWeight(inventories, items) {
  return inventories.reduce((sum, inv) => sum + inventoryWeight(inv, items), 0);
}

export function occupancy(inv, items) {
  if (inv.maxWeight == null || inv.maxWeight === 0) return null;
  return inventoryWeight(inv, items) / inv.maxWeight;
}

export function occupancyTone(p) {
  if (p == null) return "neutral";
  if (p < 0.5)  return "ok";
  if (p < 0.8)  return "warn";
  if (p < 1.0)  return "high";
  return "over";
}

export function debounce(fn, ms = 200) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

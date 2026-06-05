// tests/setup.js
// Runs before every test file. Wipes localStorage and seeds a
// deterministic crypto.randomUUID so ids are stable in snapshots.

import { afterEach, beforeEach } from "vitest";

let counter = 0;

beforeEach(() => {
  counter = 0;
  if (!globalThis.crypto) globalThis.crypto = {};
  // Always override, even if happy-dom already provides one, so tests
  // are deterministic.
  globalThis.crypto.randomUUID = () => {
    counter += 1;
    return `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`;
  };
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

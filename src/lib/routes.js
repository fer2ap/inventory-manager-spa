// src/lib/routes.js
// Route table for the tiny hash router.

import ListView from "./views/ListView.svelte";
import SheetView from "./views/SheetView.svelte";
import NotFound from "./views/NotFound.svelte";

export const routes = [
  { pattern: "/", component: ListView, userData: { title: "Personagens" } },
  { pattern: "/characters/:id", component: SheetView, userData: { title: "Ficha" } },
  { pattern: "*", component: NotFound, userData: { title: "Não encontrado" } },
];

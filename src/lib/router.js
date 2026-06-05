// src/lib/router.js
// Tiny hash-based router (~30 lines, no deps). Svelte 5 native.
//
// Usage:
//   <script>
//     import Router from "$lib/router.js";
//     import { routes } from "$lib/router.js";
//   </script>
//   <Router {routes} />
//
// Each route is { pattern, component, userData }.
// Pattern supports a single :id segment, e.g. "/characters/:id".
// The matched component receives `params` and `userData` as props.

import { mount, unmount } from "svelte";
import { tick } from "svelte";

const routes = [];

let currentInstance = null;
let currentNode = null;
let currentPattern = null;
let mountNode = null;

function parse(pattern) {
  return pattern.split("/").filter(Boolean);
}

function match(route, path) {
  const rp = parse(route.pattern);
  const pp = parse(path);
  if (rp.length !== pp.length) return null;
  const params = {};
  for (let i = 0; i < rp.length; i++) {
    if (rp[i].startsWith(":")) {
      params[rp[i].slice(1)] = decodeURIComponent(pp[i]);
    } else if (rp[i] !== pp[i]) {
      return null;
    }
  }
  return params;
}

function resolve() {
  const path = (location.hash.replace(/^#/, "") || "/") || "/";
  for (const r of routes) {
    const params = match(r, path);
    if (params) return { route: r, params, path };
  }
  return { route: routes.find((r) => r.pattern === "*") || null, params: {}, path };
}

async function render() {
  const { route, params } = resolve();
  if (!route) return;
  // Tear down previous instance
  if (currentInstance) {
    unmount(currentInstance);
    currentInstance = null;
  }
  if (currentNode && currentNode.parentNode) {
    currentNode.parentNode.removeChild(currentNode);
    currentNode = null;
  }
  if (!mountNode) return;
  currentNode = document.createElement("div");
  mountNode.appendChild(currentNode);
  currentInstance = mount(route.component, {
    target: currentNode,
    props: { params, userData: route.userData },
  });
  await tick();
  // Scroll to top on every navigation, but respect #anchors
  if (!location.hash.includes("#")) {
    window.scrollTo({ top: 0 });
  }
}

export function addRoute(route) {
  routes.push(route);
}

export function navigate(path) {
  if (!path.startsWith("/")) path = "/" + path;
  location.hash = "#" + path;
}

export function push(path) {
  navigate(path);
}

/** Svelte action: intercepts clicks on <a href="#/..."> and uses navigate() instead. */
export function link(node) {
  function handleClick(e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0) return;
    const href = node.getAttribute("href");
    if (!href || !href.startsWith("#/")) return;
    e.preventDefault();
    navigate(href.slice(1));
  }
  node.addEventListener("click", handleClick);
  return {
    destroy() {
      node.removeEventListener("click", handleClick);
    },
  };
}

export default function Router(node, options) {
  mountNode = node;
  for (const r of options.routes) addRoute(r);
  window.addEventListener("hashchange", render);
  render();
  return {
    destroy() {
      window.removeEventListener("hashchange", render);
      if (currentInstance) {
        unmount(currentInstance);
        currentInstance = null;
      }
    },
  };
}

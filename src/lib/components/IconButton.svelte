<script>
  // A small, accessible button that supports an icon and three variants.
  let {
    label = "",
    icon = null,
    variant = "ghost",  // "ghost" | "primary" | "danger"
    type = "button",
    disabled = false,
    title = null,
    onclick = null,
  } = $props();
</script>

<button
  {type}
  {disabled}
  {title}
  class="iconbtn v-{variant}"
  aria-label={label || title}
  onclick={onclick}
>
  {#if icon}{@html icon}{/if}
  <slot></slot>
</button>

<style>
  .iconbtn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font: inherit;
    font-size: 0.85rem;
    border-radius: 8px;
    padding: 0.45rem 0.7rem;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  }
  .iconbtn:disabled { opacity: 0.5; cursor: not-allowed; }
  .iconbtn.v-ghost { background: transparent; color: var(--text-muted); border-color: var(--border); }
  .iconbtn.v-ghost:hover:not(:disabled) { background: var(--surface-hover); color: var(--text); }
  .iconbtn.v-primary { background: var(--accent); color: white; }
  .iconbtn.v-primary:hover:not(:disabled) { background: var(--accent-hover); }
  .iconbtn.v-danger { background: transparent; color: #ef4444; border-color: rgba(239,68,68,0.3); }
  .iconbtn.v-danger:hover:not(:disabled) { background: rgba(239,68,68,0.08); }
  .iconbtn :global(svg) { width: 16px; height: 16px; }
</style>

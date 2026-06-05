<script>
  import { link } from "../router.js";
  let { title = "Inventário D&D", showBack = false, actions = null } = $props();
</script>

<header class="app-header">
  <div class="left">
    {#if showBack}
      <a href="#/" use:link class="back" aria-label="Voltar para a lista">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
      </a>
    {/if}
    <a href="#/" use:link class="brand">
      <span class="dot"></span>
      <span class="title">{title}</span>
    </a>
  </div>
  <div class="right">
    {#if actions}{@render actions()}{/if}
  </div>
</header>

<style>
  .app-header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1.25rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    backdrop-filter: saturate(180%) blur(8px);
  }
  .left, .right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--text);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    letter-spacing: -0.01em;
  }
  .dot {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    background: var(--accent);
  }
  .back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--text-muted);
    border-radius: 8px;
    text-decoration: none;
    transition: background 120ms ease;
  }
  .back:hover { background: var(--surface-hover); color: var(--text); }
</style>

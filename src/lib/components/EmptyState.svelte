<script>
  let { title = "Nada por aqui", message = "", icon = null } = $props();
</script>

<div class="empty">
  {#if icon}
    <div class="icon" aria-hidden="true">{@html icon}</div>
  {/if}
  <div class="title">{title}</div>
  {#if message}<div class="message">{message}</div>{/if}
  <div class="actions"><slot></slot></div>
</div>

<style>
  .empty {
    text-align: center;
    padding: 3rem 1rem;
    border: 1px dashed var(--border);
    border-radius: 14px;
    background: var(--surface-soft);
  }
  .icon { color: var(--text-muted); margin-bottom: 0.75rem; }
  .icon :global(svg) { width: 36px; height: 36px; }
  .title { font-weight: 600; margin-bottom: 0.25rem; }
  .message { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem; }
</style>

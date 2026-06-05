<script>
  import { toast } from "../stores/toast.js";
</script>

<div class="toast-stack" role="region" aria-live="polite" aria-label="Notificações">
  {#each $toast as t (t.id)}
    <button
      class="toast tone-{t.type}"
      type="button"
      onclick={() => toast.dismiss(t.id)}
    >
      {t.message}
    </button>
  {/each}
</div>

<style>
  .toast-stack {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    min-width: 220px;
    max-width: 360px;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: transform 120ms ease, opacity 120ms ease;
  }
  .toast:hover { transform: translateY(-1px); }
  .toast.tone-ok    { border-left: 3px solid #10b981; }
  .toast.tone-info  { border-left: 3px solid var(--accent); }
  .toast.tone-warn  { border-left: 3px solid #f59e0b; }
  .toast.tone-error { border-left: 3px solid #ef4444; }
</style>

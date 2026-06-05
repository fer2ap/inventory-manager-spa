<script>
  import { dialog } from "../stores/dialog.js";
</script>

{#if $dialog.queue.length > 0}
  {#each $dialog.queue as d (d.id)}
    <div class="backdrop" role="presentation" onclick={() => dialog.close(d.id, false)} onkeydown={(e) => { if (e.key === 'Escape') dialog.close(d.id, false); }}>
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dlg-title-{d.id}"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        {#if d.title}
          <h2 class="title" id="dlg-title-{d.id}">{d.title}</h2>
        {/if}
        <p class="message">{d.message}</p>
        <div class="actions">
          {#if d.showCancel}
            <button type="button" class="btn ghost" onclick={() => dialog.close(d.id, false)}>{d.cancelLabel}</button>
          {/if}
          <button type="button" class="btn primary" onclick={() => dialog.close(d.id, true)} autofocus>{d.confirmLabel}</button>
        </div>
      </div>
    </div>
  {/each}
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(20, 20, 24, 0.4);
    backdrop-filter: blur(2px);
  }
  .dialog {
    width: min(420px, calc(100% - 2rem));
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem 1.25rem 1rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  }
  .title { margin: 0 0 0.5rem; font-size: 1.05rem; font-weight: 600; }
  .message { margin: 0 0 1rem; color: var(--text-muted); line-height: 1.5; font-size: 0.95rem; }
  .actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
  .btn {
    font: inherit;
    border-radius: 8px;
    padding: 0.5rem 0.9rem;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
  }
  .btn.ghost { background: transparent; color: var(--text-muted); }
  .btn.ghost:hover { background: var(--surface-hover); color: var(--text); }
  .btn.primary { background: var(--accent); color: white; }
  .btn.primary:hover { background: var(--accent-hover); }
</style>

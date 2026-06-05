<script>
  let { keys = [] } = $props();
</script>

<span class="kbd-hint">
  {#each keys as k, i}
    <kbd>{k}</kbd>{#if i < keys.length - 1}<span class="plus">+</span>{/if}
  {/each}
</span>

<style>
  .kbd-hint { display: inline-flex; align-items: center; gap: 0.25rem; }
  kbd {
    display: inline-block;
    font: 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--surface-hover);
    border: 1px solid var(--border);
    color: var(--text-muted);
    border-radius: 4px;
    padding: 2px 5px;
  }
  .plus { color: var(--text-muted); font-size: 0.75rem; }
</style>

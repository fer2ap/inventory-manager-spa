<script>
  import { formatKg, itemWeight } from "../utils.js";
  import IconButton from "./IconButton.svelte";

  let { item, canEdit = true, isFirst = false, isLast = false, onEdit = null, onDelete = null, onMoveUp = null, onMoveDown = null } = $props();
  const total = $derived(itemWeight(item));
  const upIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>`;
  const downIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
</script>

<div class="row">
  <div class="info">
    <div class="name">{item.name}</div>
    {#if item.description}
      <div class="desc">{item.description}</div>
    {/if}
    <div class="stats">
      <span class="stat">{item.quantity}×</span>
      <span class="stat">{formatKg(item.unitWeight)} kg</span>
      <span class="stat total">= {formatKg(total)} kg</span>
    </div>
  </div>
  {#if canEdit}
    <div class="actions">
      <IconButton
        variant="ghost"
        label="Mover para cima"
        title="Mover para cima"
        icon={upIcon}
        disabled={isFirst}
        onclick={() => onMoveUp?.(item)}
      />
      <IconButton
        variant="ghost"
        label="Mover para baixo"
        title="Mover para baixo"
        icon={downIcon}
        disabled={isLast}
        onclick={() => onMoveDown?.(item)}
      />
      <IconButton
        variant="ghost"
        label="Editar item"
        title="Editar"
        icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`}
        onclick={() => onEdit?.(item)}
      />
      <IconButton
        variant="danger"
        label="Excluir item"
        title="Excluir"
        icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>`}
        onclick={() => onDelete?.(item)}
      />
    </div>
  {/if}
</div>

<style>
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.6rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: grab;
  }
  .row:active { cursor: grabbing; }
  .info { min-width: 0; }
  .name { font-size: 0.9rem; font-weight: 500; }
  .desc { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.1rem; }
  .stats { display: flex; gap: 0.5rem; margin-top: 0.15rem; font-size: 0.78rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
  .total { color: var(--text); font-weight: 500; }
  .actions { display: flex; gap: 0.15rem; flex-shrink: 0; }
</style>

<script>
  import { dndzone, SOURCES, TRIGGERS } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { formatKg, formatPct, inventoryWeight, occupancy, occupancyTone } from "../utils.js";
  import ItemRow from "./ItemRow.svelte";
  import IconButton from "./IconButton.svelte";

  let {
    inventory,
    items = [],
    canEdit = true,
    onAddItem = null,
    onEditItem = null,
    onDeleteItem = null,
    onEditInventory = null,
    onDeleteInventory = null,
    onDropItem = null,
    onMoveItemUp = null,
    onMoveItemDown = null,
  } = $props();

  const flipDurationMs = 180;
  const weight = $derived(inventoryWeight(inventory, items));
  const occ = $derived(occupancy(inventory, items));
  const tone = $derived(occupancyTone(occ));
  const localItems = $derived(items.filter((i) => i.inventoryId === inventory.id));

  function handleConsider(e) {
    if (!onDropItem) return;
    onDropItem({ inventoryId: inventory.id, items: e.detail.items, info: e.detail.info, phase: "consider" });
  }
  function handleFinalize(e) {
    if (!onDropItem) return;
    onDropItem({ inventoryId: inventory.id, items: e.detail.items, info: e.detail.info, phase: "finalize" });
  }
</script>

<section class="card tone-{tone}">
  <header class="head">
    <div>
      <h3 class="name">
        {inventory.name}
        {#if inventory.isDefault}<span class="badge">padrão</span>{/if}
      </h3>
      {#if inventory.description}
        <p class="desc">{inventory.description}</p>
      {/if}
    </div>
    {#if canEdit}
      <div class="head-actions">
        <IconButton
          variant="ghost"
          label="Adicionar item"
          title="Adicionar item"
          icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`}
          onclick={() => onAddItem?.(inventory.id)}
        />
        <IconButton
          variant="ghost"
          label="Editar inventário"
          title="Editar inventário"
          icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`}
          onclick={() => onEditInventory?.(inventory)}
        />
        {#if !inventory.isDefault}
          <IconButton
            variant="danger"
            label="Excluir inventário"
            title={localItems.length > 0 ? "Esvazie o inventário antes de excluí-lo" : "Excluir inventário"}
            icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>`}
            disabled={localItems.length > 0}
            onclick={() => onDeleteInventory?.(inventory)}
          />
        {/if}
      </div>
    {/if}
  </header>

  <div class="capacity">
    <div class="row">
      <span class="weight">{formatKg(weight)} kg</span>
      <span class="cap">
        {#if occ == null}
          sem limite
        {:else}
          {formatPct(occ)} de {formatKg(inventory.maxWeight)} kg
        {/if}
      </span>
    </div>
    {#if occ != null}
      <div class="bar" aria-hidden="true">
        <div class="fill tone-{tone}" style="width: {Math.min(100, occ * 100)}%"></div>
      </div>
    {/if}
  </div>

  <div class="items">
    <div
      class="items-zone"
      use:dndzone={{
        items: localItems,
        flipDurationMs,
        dropTargetStyle: {},
        type: "item",
        dropFromOthersDisabled: false,
      }}
      onconsider={handleConsider}
      onfinalize={handleFinalize}
    >
      {#each localItems as item, idx (item.id)}
        <div animate:flip={{ duration: flipDurationMs }}>
          <ItemRow
            {item}
            isFirst={idx === 0}
            isLast={idx === localItems.length - 1}
            onEdit={() => onEditItem?.(item)}
            onDelete={() => onDeleteItem?.(item)}
            onMoveUp={() => onMoveItemUp?.(item)}
            onMoveDown={() => onMoveItemDown?.(item)}
          />
        </div>
      {/each}
    </div>
    {#if localItems.length === 0}
      <p class="empty">Nenhum item. Clique em <strong>+</strong> para adicionar.</p>
    {/if}
  </div>
</section>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1rem 1rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }
  .card.tone-over { border-color: rgba(239, 68, 68, 0.45); }
  .card.tone-high { border-color: rgba(245, 158, 11, 0.45); }
  .card.tone-warn { border-color: rgba(234, 179, 8, 0.35); }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; }
  .name { margin: 0; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
  .desc { margin: 0.15rem 0 0; color: var(--text-muted); font-size: 0.85rem; }
  .badge {
    font-size: 0.7rem;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    background: var(--surface-hover);
    color: var(--text-muted);
    font-weight: 500;
  }
  .head-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }
  .capacity { display: flex; flex-direction: column; gap: 0.35rem; }
  .row { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.85rem; }
  .weight { font-weight: 600; font-variant-numeric: tabular-nums; }
  .cap { color: var(--text-muted); }
  .bar { height: 6px; background: var(--surface-hover); border-radius: 999px; overflow: hidden; }
  .fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #f97316 100%);
    transition: width 180ms ease, background 180ms ease;
  }
  .fill.tone-over { background: #ef4444; }
  .items { display: flex; flex-direction: column; gap: 0.25rem; min-height: 1.5rem; }
  .items-zone { display: flex; flex-direction: column; gap: 0.25rem; }
  .empty { color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 0.5rem 0; }
</style>

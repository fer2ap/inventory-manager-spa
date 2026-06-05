<script>
  import { push } from "../router.js";
  import { dndzone } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import * as storage from "../../lib/storage.js";
  import { exportCharacter } from "../../lib/io/export.js";
  import { toastOk, toastError } from "../../lib/stores/toast.js";
  import { confirmDialog } from "../../lib/stores/dialog.js";
  import { characterWeight, formatKg, occupancyTone } from "../../lib/utils.js";
  import Header from "../components/Header.svelte";
  import InventoryCard from "../components/InventoryCard.svelte";
  import EmptyState from "../components/EmptyState.svelte";
  import IconButton from "../components/IconButton.svelte";
  import CharacterForm from "../forms/CharacterForm.svelte";
  import InventoryForm from "../forms/InventoryForm.svelte";
  import ItemForm from "../forms/ItemForm.svelte";
  import Dialog from "../components/Dialog.svelte";

  let { params = {} } = $props();
  const characterId = $derived(params.id);

  let sheet = $state(null); // { character, inventories, items }
  let modal = $state(null); // polymorphic

  function titleFor(m) {
    switch (m?.kind) {
      case "editCharacter":   return "Editar personagem";
      case "createInventory": return "Novo inventário";
      case "editInventory":   return "Editar inventário";
      case "createItem":      return "Novo item";
      case "editItem":        return "Editar item";
      default:                return "";
    }
  }

  function load() {
    try {
      sheet = storage.getSheet(characterId);
    } catch (err) {
      toastError(err.message);
      push("/");
    }
  }

  $effect(() => {
    if (characterId) load();
  });

  function openEditCharacter() { modal = { kind: "editCharacter" }; }
  function openCreateInventory() { modal = { kind: "createInventory" }; }
  function openEditInventory(inv) { modal = { kind: "editInventory", inventory: inv }; }
  function openCreateItem(inventoryId) { modal = { kind: "createItem", inventoryId }; }
  function openEditItem(item) { modal = { kind: "editItem", item }; }
  function closeModal() { modal = null; }

  async function handleSubmit(form) {
    if (!modal) return;
    try {
      switch (modal.kind) {
        case "editCharacter":
          storage.updateCharacter(sheet.character.id, form);
          toastOk("Personagem atualizado.");
          break;
        case "createInventory":
          storage.createInventory(sheet.character.id, form);
          toastOk("Inventário criado.");
          break;
        case "editInventory":
          storage.updateInventory(modal.inventory.id, form);
          toastOk("Inventário atualizado.");
          break;
        case "createItem":
          storage.createItem(modal.inventoryId, form);
          toastOk("Item adicionado.");
          break;
        case "editItem":
          storage.updateItem(modal.item.id, form);
          toastOk("Item atualizado.");
          break;
      }
      closeModal();
      load();
    } catch (err) {
      throw err; // form will display
    }
  }

  async function handleDeleteCharacter() {
    const ok = await confirmDialog(
      `Excluir "${sheet.character.name}"? Todos os inventários e itens serão removidos.`,
      { title: "Excluir personagem", confirmLabel: "Excluir", variant: "danger" }
    );
    if (!ok) return;
    try {
      storage.deleteCharacter(sheet.character.id);
      toastOk(`"${sheet.character.name}" excluído.`);
      push("/");
    } catch (err) {
      toastError(err.message);
    }
  }

  async function handleDeleteInventory(inv) {
    const ok = await confirmDialog(
      `Excluir inventário "${inv.name}"? (deve estar vazio)`,
      { title: "Excluir inventário", confirmLabel: "Excluir", variant: "danger" }
    );
    if (!ok) return;
    try {
      storage.deleteInventory(inv.id);
      toastOk(`"${inv.name}" excluído.`);
      load();
    } catch (err) {
      toastError(err.message);
    }
  }

  async function handleDeleteItem(item) {
    const ok = await confirmDialog(
      `Excluir "${item.name}"?`,
      { title: "Excluir item", confirmLabel: "Excluir", variant: "danger" }
    );
    if (!ok) return;
    try {
      storage.deleteItem(item.id);
      toastOk(`"${item.name}" excluído.`);
      load();
    } catch (err) {
      toastError(err.message);
    }
  }

  function handleMoveItem(item, direction) {
    try {
      storage.moveItemOrder(item.id, direction);
      load();
    } catch (err) {
      toastError(err.message);
    }
  }

  function handleDropItem(event) {
    const { phase, inventoryId, items: proposed, info } = event;
    if (phase === "consider") {
      const rewritten = proposed.map((it) => ({ ...it, inventoryId }));
      const proposedIds = new Set(rewritten.map((it) => it.id));
      const others = sheet.items.filter((i) => {
        if (proposedIds.has(i.id)) return false;
        if (i.inventoryId === inventoryId) return false;
        return true;
      });
      sheet = { ...sheet, items: [...rewritten, ...others] };
    } else if (phase === "finalize") {
      const trigger = info?.trigger;
      const draggedId = info?.id;
      const isSourceOfCrossZone = trigger === "droppedIntoAnother"
        && !proposed.some((it) => it.id === draggedId);
      for (const it of proposed) {
        const original = storage.getItem(it.id);
        if (original && original.inventoryId !== inventoryId) {
          try {
            storage.moveItem(it.id, inventoryId);
          } catch (err) {
            toastError(err.message);
          }
        }
      }
      if (!isSourceOfCrossZone) {
        try {
          storage.reorderItems(inventoryId, proposed.map((it) => it.id));
        } catch (err) {
          toastError(err.message);
        }
      }
      load();
    }
  }

  function handleConsiderInventory(e) {
    sheet = { ...sheet, inventories: e.detail.items };
  }

  function handleFinalizeInventory(e) {
    try {
      storage.reorderInventories(sheet.character.id, e.detail.items.map((inv) => inv.id));
    } catch (err) {
      toastError(err.message);
    }
    load();
  }

  function handleExport() {
    exportCharacter(sheet.character.id);
    toastOk("Personagem exportado.");
  }

  const totalWeight = $derived(sheet ? characterWeight(sheet.inventories, sheet.items) : 0);
  const characterOcc = $derived(
    sheet?.character?.maxWeight ? totalWeight / sheet.character.maxWeight : null
  );
  const characterTone = $derived(occupancyTone(characterOcc));
  const canDeleteCharacter = $derived(
    !!sheet && sheet.inventories.every((i) => i.isDefault)
  );
</script>

<Header showBack title={sheet?.character?.name ?? "Ficha"}>
  {#snippet actions()}
    <IconButton variant="ghost" label="Exportar personagem" onclick={handleExport}
      icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>`}
    >Exportar</IconButton>
    <IconButton variant="ghost" label="Editar personagem" onclick={openEditCharacter}
      icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`}
    >Editar</IconButton>
    <IconButton
      variant="danger"
      label="Excluir personagem"
      title={canDeleteCharacter ? "Excluir personagem" : "Exclua os inventários não padrão antes de remover o personagem"}
      disabled={!canDeleteCharacter}
      onclick={handleDeleteCharacter}
      icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>`}
    >Excluir</IconButton>
  {/snippet}
</Header>

<main id="main" class="container">
  {#if sheet}
    <section class="summary">
      <h2 class="summary-name">{sheet.character.name}</h2>
      <div class="summary-row">
        <span class="summary-weight">{formatKg(totalWeight)} kg</span>
        <span class="summary-cap">
          {#if characterOcc == null}
            sem limite
          {:else}
            de {formatKg(sheet.character.maxWeight)} kg
          {/if}
        </span>
      </div>
      {#if characterOcc != null}
        <div class="summary-bar" aria-hidden="true">
          <div class="summary-fill tone-{characterTone}" style="width: {Math.min(100, characterOcc * 100)}%"></div>
        </div>
      {/if}
    </section>

    <section class="inventories-header">
      <h2>Inventários</h2>
      <IconButton variant="primary" label="Novo inventário" onclick={openCreateInventory}
        icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`}
      >Novo inventário</IconButton>
    </section>

    {#if sheet.inventories.length === 0}
      <EmptyState title="Nenhum inventário" message="Crie um inventário para começar.">
        <IconButton variant="primary" onclick={openCreateInventory}>Criar inventário</IconButton>
      </EmptyState>
    {:else}
      <section
        class="inv-grid"
        use:dndzone={{
          items: sheet.inventories,
          flipDurationMs: 180,
          dropTargetStyle: {},
          type: "inventory",
        }}
        onconsider={handleConsiderInventory}
        onfinalize={handleFinalizeInventory}
      >
        {#each sheet.inventories as inv (inv.id)}
          <div animate:flip={{ duration: 180 }}>
            <InventoryCard
              inventory={inv}
              items={sheet.items}
              onAddItem={openCreateItem}
              onEditItem={openEditItem}
              onDeleteItem={handleDeleteItem}
              onEditInventory={openEditInventory}
              onDeleteInventory={handleDeleteInventory}
              onDropItem={handleDropItem}
              onMoveItemUp={(it) => handleMoveItem(it, "up")}
              onMoveItemDown={(it) => handleMoveItem(it, "down")}
            />
          </div>
        {/each}
      </section>
    {/if}
  {:else}
    <p class="loading">Carregando…</p>
  {/if}
</main>

{#if modal}
  <div
    class="backdrop"
    role="presentation"
    onmousedown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    onkeydown={(e) => { if (e.key === 'Escape') closeModal(); }}
  >
    <div class="modal" role="dialog" aria-modal="true" tabindex="-1">
      <h2 class="modal-title">{titleFor(modal)}</h2>
      {#if modal.kind === "editCharacter"}
        <CharacterForm initial={sheet.character} onSubmit={handleSubmit} onCancel={closeModal} submitLabel="Salvar" />
      {:else if modal.kind === "createInventory"}
        <InventoryForm onSubmit={handleSubmit} onCancel={closeModal} submitLabel="Criar" />
      {:else if modal.kind === "editInventory"}
        <InventoryForm initial={modal.inventory} isDefault={modal.inventory.isDefault} onSubmit={handleSubmit} onCancel={closeModal} submitLabel="Salvar" />
      {:else if modal.kind === "createItem"}
        <ItemForm onSubmit={handleSubmit} onCancel={closeModal} submitLabel="Adicionar" />
      {:else if modal.kind === "editItem"}
        <ItemForm initial={modal.item} onSubmit={handleSubmit} onCancel={closeModal} submitLabel="Salvar" />
      {/if}
    </div>
  </div>
{/if}

<Dialog />

<style>
  .container { max-width: 1200px; margin: 0 auto; padding: 1.25rem 1.25rem 6rem; }
  .summary {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1rem 1.1rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .summary-name { margin: 0; font-size: 1.25rem; font-weight: 600; }
  .summary-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.85rem; }
  .summary-weight { font-weight: 600; font-variant-numeric: tabular-nums; }
  .summary-cap { color: var(--text-muted); }
  .summary-bar { height: 6px; background: var(--surface-hover); border-radius: 999px; overflow: hidden; }
  .summary-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #f97316 100%);
    transition: width 180ms ease, background 180ms ease;
  }
  .summary-fill.tone-over { background: #ef4444; }

  .inventories-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
  .inventories-header h2 { margin: 0; font-size: 1.05rem; font-weight: 600; }

  .inv-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 0.85rem;
    align-items: start;
  }
  .loading { color: var(--text-muted); }

  .backdrop {
    position: fixed; inset: 0; z-index: 800;
    display: flex; align-items: center; justify-content: center;
    background: rgba(20,20,24,0.4); backdrop-filter: blur(2px);
  }
  .modal {
    width: min(480px, calc(100% - 2rem));
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  }
  .modal-title { margin: 0 0 1rem; font-size: 1.05rem; font-weight: 600; }
</style>

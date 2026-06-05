<script>
  import { onMount } from "svelte";
  import * as storage from "../../lib/storage.js";
  import { exportAll } from "../../lib/io/export.js";
  import { readJsonFile, parseExport, importAll } from "../../lib/io/import.js";
  import { characters } from "../../lib/stores/characters.js";
  import { toastOk, toastError, toastInfo } from "../../lib/stores/toast.js";
  import { confirmDialog } from "../../lib/stores/dialog.js";
  import { characterWeight, formatKg, itemWeight } from "../../lib/utils.js";
  import Header from "../components/Header.svelte";
  import CharacterCard from "../components/CharacterCard.svelte";
  import EmptyState from "../components/EmptyState.svelte";
  import IconButton from "../components/IconButton.svelte";
  import CharacterForm from "../forms/CharacterForm.svelte";
  import Dialog from "../components/Dialog.svelte";
  import KbdHint from "../components/KbdHint.svelte";

  let modal = $state(null); // { kind: "create" | "edit", character?: Character }

  let importFileInput = $state(null);

  const allItemsByCharacter = $derived.by(() => computeWeights());

  function computeWeights() {
    const map = {};
    const all = JSON.parse(localStorage.getItem("inv:v1:items") || "[]");
    for (const c of $characters) {
      const { inventories } = storage.getSheet(c.id);
      const invIds = new Set(inventories.map((i) => i.id));
      const items = all.filter((it) => invIds.has(it.inventoryId));
      const total = items.reduce((s, it) => s + itemWeight(it), 0);
      map[c.id] = { total, count: items.length };
    }
    return map;
  }

  onMount(() => {
    characters.refresh();
  });

  function openCreate() {
    modal = { kind: "create" };
  }
  function openEdit(c) {
    modal = { kind: "edit", character: c };
  }
  function closeModal() {
    modal = null;
  }

  async function handleSubmit(form) {
    if (modal.kind === "create") {
      const c = storage.createCharacter(form);
      toastOk(`Personagem "${c.name}" criado.`);
    } else if (modal.kind === "edit") {
      storage.updateCharacter(modal.character.id, form);
      toastOk("Personagem atualizado.");
    }
    characters.refresh();
    closeModal();
  }

  async function handleDelete(c) {
    const ok = await confirmDialog(
      `Excluir "${c.name}"? Todos os inventários e itens serão removidos.`,
      { title: "Excluir personagem", confirmLabel: "Excluir", variant: "danger" }
    );
    if (!ok) return;
    try {
      storage.deleteCharacter(c.id);
      characters.refresh();
      toastOk(`"${c.name}" excluído.`);
    } catch (err) {
      toastError(err.message || "Erro ao excluir.");
    }
  }

  function handleExportAll() {
    if ($characters.length === 0) {
      toastInfo("Nada para exportar.");
      return;
    }
    exportAll();
    toastOk("Exportação baixada.");
  }

  function pickImport() {
    importFileInput?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking same file
    if (!file) return;
    try {
      const text = await readJsonFile(file);
      const data = parseExport(text);
      const mode = await pickMode();
      if (!mode) return;
      const result = importAll(data, { mode });
      characters.refresh();
      toastOk(`Importação concluída (${result.added} ${result.added === 1 ? "personagem" : "personagens"}).`);
    } catch (err) {
      toastError(err.message || "Falha ao importar.");
    }
  }

  async function pickMode() {
    // Reuse confirmDialog with a "merge" default. For a richer picker,
    // we could add a 3-button dialog, but the merge/replace trade-off
    // is enough for v1.
    return confirmDialog(
      "Importar? (OK = mesclar com existentes; Cancelar = substituir tudo)",
      { title: "Modo de importação", confirmLabel: "Mesclar", cancelLabel: "Substituir" }
    ).then((merge) => (merge ? "merge" : "replace"));
  }

  function handleKey(e) {
    if (e.key === "n" && !modal && document.activeElement?.tagName !== "INPUT") {
      e.preventDefault();
      openCreate();
    }
  }
</script>

<svelte:window onkeydown={handleKey} />

<Header>
  {#snippet actions()}
    <span class="kbd-tip"><KbdHint keys={["N"]} /> novo</span>
    <IconButton
      variant="primary"
      label="Novo personagem"
      onclick={openCreate}
      icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`}
    >
      Novo
    </IconButton>
  {/snippet}
</Header>

<main id="main" class="container">
  {#if $characters.length === 0}
    <EmptyState
      title="Nenhum personagem ainda"
      message="Crie seu primeiro personagem para começar."
      icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6M19 8v6"/></svg>`}
    >
      <IconButton variant="primary" label="Criar primeiro personagem" onclick={openCreate}>Criar primeiro personagem</IconButton>
    </EmptyState>
  {:else}
    <div class="grid">
      {#each $characters as c (c.id)}
        <CharacterCard
          character={c}
          totalWeight={allItemsByCharacter[c.id]?.total ?? 0}
          itemCount={allItemsByCharacter[c.id]?.count ?? 0}
        />
      {/each}
    </div>
  {/if}

  <div class="toolbar">
    <IconButton variant="ghost" label="Exportar tudo" onclick={handleExportAll}
      icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>`}
    >Exportar tudo</IconButton>
    <IconButton variant="ghost" label="Importar" onclick={pickImport}
      icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>`}
    >Importar</IconButton>
    <input
      type="file"
      accept="application/json"
      bind:this={importFileInput}
      onchange={handleImportFile}
      hidden
    />
  </div>
</main>

{#if modal}
  <div class="backdrop" role="presentation" onclick={closeModal} onkeydown={(e) => { if (e.key === 'Escape') closeModal(); }}>
    <div class="modal" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
      <h2 class="modal-title">
        {modal.kind === "create" ? "Novo personagem" : `Editar "${modal.character.name}"`}
      </h2>
      <CharacterForm
        initial={modal.kind === "edit" ? modal.character : null}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />
    </div>
  </div>
{/if}

<Dialog />

<style>
  .container { max-width: 880px; margin: 0 auto; padding: 1.5rem 1.25rem 6rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
  .toolbar { display: flex; gap: 0.5rem; margin-top: 1.5rem; justify-content: flex-end; }
  .kbd-tip { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--text-muted); font-size: 0.78rem; }

  .backdrop {
    position: fixed; inset: 0; z-index: 800;
    display: flex; align-items: center; justify-content: center;
    background: rgba(20,20,24,0.4); backdrop-filter: blur(2px);
  }
  .modal {
    width: min(440px, calc(100% - 2rem));
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.25rem;
    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  }
  .modal-title { margin: 0 0 1rem; font-size: 1.05rem; font-weight: 600; }
</style>

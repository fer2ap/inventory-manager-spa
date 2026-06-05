<script>
  import Field from "../components/Field.svelte";
  import IconButton from "../components/IconButton.svelte";

  let { initial = null, onSubmit, onCancel, submitLabel = "Salvar" } = $props();

  let name = $state(initial?.name ?? "");
  let maxWeightEnabled = $state(initial?.maxWeight != null);
  let maxWeight = $state(initial?.maxWeight ?? 30);
  let error = $state(null);
  let submitting = $state(false);

  async function handleSubmit(e) {
    e.preventDefault();
    error = null;
    if (!name.trim()) {
      error = "Informe o nome do personagem.";
      return;
    }
    submitting = true;
    try {
      await onSubmit({
        name: name.trim(),
        maxWeight: maxWeightEnabled ? Number(maxWeight) : null,
      });
    } catch (err) {
      error = err.message || "Erro ao salvar.";
    } finally {
      submitting = false;
    }
  }
</script>

<form onsubmit={handleSubmit} class="form">
  <Field
    label="Nome"
    bind:value={name}
    required
    placeholder="Ex.: Aragorn"
    autofocus
  />
  <div class="row">
    <label class="check">
      <input type="checkbox" bind:checked={maxWeightEnabled} />
      <span>Definir capacidade máxima (kg)</span>
    </label>
  </div>
  {#if maxWeightEnabled}
    <Field
      label="Capacidade máxima (kg)"
      type="number"
      bind:value={maxWeight}
      min="0"
      step="0.5"
      hint="Em kg. Use 0 para desativar checagem."
    />
  {:else}
    <p class="hint">Sem limite definido — você poderá editar a qualquer momento.</p>
  {/if}
  {#if error}<div class="err">{error}</div>{/if}
  <div class="actions">
    <IconButton variant="ghost" type="button" onclick={onCancel} disabled={submitting}>Cancelar</IconButton>
    <IconButton variant="primary" type="submit" disabled={submitting}>{submitting ? "Salvando…" : submitLabel}</IconButton>
  </div>
</form>

<style>
  .form { display: flex; flex-direction: column; gap: 0.9rem; }
  .row { display: flex; align-items: center; gap: 0.5rem; }
  .check { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); cursor: pointer; }
  .hint { font-size: 0.78rem; color: var(--text-muted); margin: 0; }
  .err { font-size: 0.85rem; color: #ef4444; }
  .actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.25rem; }
</style>

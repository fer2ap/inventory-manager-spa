<script>
  import Field from "../components/Field.svelte";
  import IconButton from "../components/IconButton.svelte";

  let { initial = null, onSubmit, onCancel, submitLabel = "Salvar" } = $props();

  let name = $state(initial?.name ?? "");
  let description = $state(initial?.description ?? "");
  let quantity = $state(initial?.quantity ?? 1);
  let unitWeight = $state(initial?.unitWeight ?? 0);
  let error = $state(null);
  let submitting = $state(false);

  async function handleSubmit(e) {
    e.preventDefault();
    error = null;
    if (!name.trim()) {
      error = "Informe o nome do item.";
      return;
    }
    const q = Number(quantity);
    const w = Number(unitWeight);
    if (!Number.isInteger(q) || q < 0) {
      error = "Quantidade deve ser um inteiro >= 0.";
      return;
    }
    if (Number.isNaN(w) || w < 0) {
      error = "Peso unitário deve ser >= 0.";
      return;
    }
    submitting = true;
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        quantity: q,
        unitWeight: w,
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
    placeholder="Ex.: Espada longa"
    autofocus
  />
  <Field
    label="Descrição"
    bind:value={description}
    placeholder="Opcional"
  />
  <div class="grid">
    <Field
      label="Quantidade"
      type="number"
      bind:value={quantity}
      min="0"
      step="1"
      required
    />
    <Field
      label="Peso unitário (kg)"
      type="number"
      bind:value={unitWeight}
      min="0"
      step="0.01"
    />
  </div>
  {#if error}<div class="err">{error}</div>{/if}
  <div class="actions">
    <IconButton variant="ghost" type="button" onclick={onCancel} disabled={submitting}>Cancelar</IconButton>
    <IconButton variant="primary" type="submit" disabled={submitting}>{submitting ? "Salvando…" : submitLabel}</IconButton>
  </div>
</form>

<style>
  .form { display: flex; flex-direction: column; gap: 0.9rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .err { font-size: 0.85rem; color: #ef4444; }
  .actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.25rem; }
  @media (max-width: 480px) {
    .grid { grid-template-columns: 1fr; }
  }
</style>

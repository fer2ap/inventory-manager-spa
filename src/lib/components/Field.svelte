<script>
  // A labelled input with optional error message and a small hint.
  let {
    label,
    value = $bindable(""),
    type = "text",
    placeholder = "",
    error = null,
    hint = null,
    required = false,
    autocomplete = null,
    id = null,
    autofocus = false,
    step = null,
    min = null,
    max = null,
    onInput = null,
  } = $props();

  const inputId = id || `f-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class="field" class:has-error={!!error}>
  <label for={inputId}>
    {label}
    {#if required}<span class="req" aria-hidden="true">*</span>{/if}
  </label>
  <input
    id={inputId}
    {type}
    {placeholder}
    {step}
    {min}
    {max}
    {autocomplete}
    bind:value
    aria-invalid={!!error}
    aria-describedby={error ? `${inputId}-err` : (hint ? `${inputId}-hint` : null)}
    {autofocus}
    oninput={onInput}
  />
  {#if error}
    <div class="err" id={`${inputId}-err`}>{error}</div>
  {:else if hint}
    <div class="hint" id={`${inputId}-hint`}>{hint}</div>
  {/if}
</div>

<style>
  .field { display: flex; flex-direction: column; gap: 0.35rem; }
  label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
  .req { color: var(--accent); margin-left: 2px; }
  input {
    font: inherit;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.55rem 0.7rem;
    outline: none;
    transition: border-color 120ms ease, box-shadow 120ms ease;
  }
  input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
  .has-error input { border-color: #ef4444; }
  .err { font-size: 0.78rem; color: #ef4444; }
  .hint { font-size: 0.78rem; color: var(--text-muted); }
</style>

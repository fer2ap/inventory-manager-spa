<script>
  import { link } from "../router.js";
  import { formatKg, formatDate } from "../utils.js";

  let { character, totalWeight = 0, itemCount = 0 } = $props();
</script>

<a class="card" href={`#/characters/${character.id}`} use:link>
  <div class="row">
    <div class="name">{character.name}</div>
    <div class="meta">
      {#if character.maxWeight == null}
        <span class="chip">Ilimitada</span>
      {:else}
        <span class="chip">{formatKg(character.maxWeight)} kg</span>
      {/if}
    </div>
  </div>
  <div class="footer">
    <span>{itemCount} {itemCount === 1 ? "item" : "itens"} · {formatKg(totalWeight)} kg</span>
    <span class="date">{formatDate(character.createdAt)}</span>
  </div>
</a>

<style>
  .card {
    display: block;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem 1.1rem;
    text-decoration: none;
    color: var(--text);
    transition: border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
  }
  .card:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.05);
  }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem; }
  .name { font-weight: 600; font-size: 1.05rem; letter-spacing: -0.01em; }
  .chip {
    font-size: 0.75rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: var(--surface-hover);
    color: var(--text-muted);
  }
  .footer { display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.8rem; }
  .date { font-variant-numeric: tabular-nums; }
</style>

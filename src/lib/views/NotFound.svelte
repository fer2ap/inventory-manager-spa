<script>
  import Header from "../components/Header.svelte";
  import EmptyState from "../components/EmptyState.svelte";
  import IconButton from "../components/IconButton.svelte";
  import { push } from "../router.js";
</script>

<Header showBack title="Não encontrado" />

<main id="main" class="container">
  <EmptyState
    title="Página não encontrada"
    message="A rota que você acessou não existe."
    icon={`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 9h.01M15 9h.01M9 15s1 1 3 1 3-1 3-1"/></svg>`}
  >
    <IconButton variant="primary" onclick={() => push("/")}>Voltar ao início</IconButton>
  </EmptyState>
</main>

<style>
  .container { max-width: 880px; margin: 0 auto; padding: 1.5rem 1.25rem 6rem; }
</style>

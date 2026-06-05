<script>
  import { onMount, onDestroy } from "svelte";
  import Router from "./lib/router.js";
  import { routes } from "./lib/routes.js";
  import Toast from "./lib/components/Toast.svelte";

  let router;
  let mountNode;

  onMount(() => {
    router = Router(mountNode, { routes });
  });

  onDestroy(() => {
    router?.destroy();
  });
</script>

<div bind:this={mountNode} class="router"></div>
<Toast />

<style>
  .router { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
</style>

<template>
  <div class="pa-4">
    <h1 class="text-h5 font-weight-bold mb-4">Search Cryptocurrencies</h1>
    <SearchBar />
    <p class="text-medium-emphasis text-body-2 mt-4">
      Type at least 2 characters to search, then click a result to view details.
    </p>
  </div>
</template>

<script setup lang="ts">
import SearchBar from "@/components/SearchBar.vue";
</script>

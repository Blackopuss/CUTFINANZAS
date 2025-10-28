<script setup></script>
<template>
  <div class="container-fondo"><slot></slot></div>
</template>
<style scoped>
.container-fondo {
  padding: 10px 5px 0 10px;
  min-height: 100vh;
  background: var(--color-fondo);
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
</style>

<script setup></script>
<template>
  <div class="container-content"><slot></slot></div>
</template>
<style scoped>
.container-content {
  border: 0.2px solid rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  min-height: fit-content;
  height: auto;
  padding: 40px;
  border-radius: 16px;
  width: 90vw;
  max-width: 90vw;
  margin: 20px 0 25px;
  background-color: var(--color-comp);
  box-shadow: 5px 5px 10px 5px rgba(0, 0, 0, 0.3);
}
</style>

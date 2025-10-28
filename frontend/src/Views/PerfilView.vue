<script setup>
import FondoPageComponent from '@/components/FondoPageComponent.vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import PlantillaComponent from '@/components/PlantillaComponent.vue'
import SideBarComponent from '@/components/SideBarComponent.vue'
</script>
<template>
  <FondoPageComponent>
    <SideBarComponent />
    <PlantillaComponent>
      <NavbarComponent />
    </PlantillaComponent>
  </FondoPageComponent>
</template>

<style scoped></style>
